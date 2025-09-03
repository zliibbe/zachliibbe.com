---
title: 'Securing a Personal Website: OAuth, Admin Routes, and the Fear of Getting Hacked'
author: 'Zach Liibbe'
publishedAt: ''
status: 'draft'
categories: ['Development', 'Learning']
tags:
  [
    'oauth',
    'security',
    'nextauth',
    'authentication',
    'admin-dashboard',
    'nextjs',
  ]
series: 'Learning in Public'
excerpt: 'The anxiety of implementing authentication for the first time and building secure admin functionality as a solo developer. How I chose OAuth over rolling my own auth and the security decisions that keep me sleeping at night.'
readTime: '11 min read'
---

# Securing a Personal Website: OAuth, Admin Routes, and the Fear of Getting Hacked

"What if someone breaks into my admin panel?"

That thought kept me awake for weeks when I was building the admin functionality for my personal website. As a solo developer, you don't have a security team to review your authentication code. You don't have penetration testers finding vulnerabilities. It's just you, Google, and the terrifying responsibility of not screwing up badly enough to end up on Hacker News for the wrong reasons.

Here's how I built secure admin functionality for my personal site while battling impostor syndrome and the constant fear that I was one misconfigured route away from disaster.

## The Decision: DIY Auth vs OAuth

My first instinct was to build my own authentication system. How hard could it be? Hash some passwords, set some cookies, check for valid sessions. I even started writing the code:

```typescript
// My terrifying first attempt
export async function login(email: string, password: string) {
  const hashedPassword = await bcrypt.hash(password, 10);
  // ... validate against database
  // ... set session cookie
  // ... hope I didn't mess up somewhere
}
```

Then I stopped and asked myself: "Do I really want to be responsible for storing passwords?"

The answer was a hard no.

## The OAuth Rabbit Hole

I decided to use OAuth with Google. Seemed simple enough—Google handles the hard parts, I just verify their tokens. But then I fell down the configuration rabbit hole.

First challenge: **which OAuth library?** The Next.js ecosystem had several options:

- NextAuth.js (now Auth.js)
- Supabase Auth
- Auth0
- Roll my own with Google's OAuth library

I spent two days reading documentation, security guides, and random Reddit threads before settling on NextAuth.js. The deciding factors:

- Built for Next.js specifically
- Good documentation (crucial for my sanity)
- Active community (someone else probably hit my exact issue)
- Handles all the OAuth edge cases I didn't know existed

## The Single-User Problem

Here's where things got interesting. My site only needed one admin: me. Most authentication systems are built for multiple users, but I just needed to lock everyone else out.

My first implementation was naive:

```typescript
// Don't do this
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      return user.email === 'zliibbe@gmail.com';
    },
  },
};
```

This worked but had a problem: anyone with a Google account could attempt to sign in. They'd get rejected, but they'd still see my OAuth consent screen. That felt wrong.

## The Hardened Approach

I refined the authentication with multiple layers of protection:

```typescript
export const authOptions: NextAuthOptions = {
  adapter: UpstashRedisAdapter(kv),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Restrict to single user
      const allowedEmail = 'zliibbe@gmail.com';

      if (user.email === allowedEmail) {
        return true;
      }

      // Redirect unauthorized users to a custom error page
      return '/auth/error?error=AccessDenied';
    },
    async session({ session, token }) {
      return session;
    },
    async jwt({ token, user }) {
      return token;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 180 * 60, // 3 hours - short enough to feel secure
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
};
```

Key security decisions:

- **JWT strategy** instead of database sessions (one less place to mess up)
- **Short session duration** (3 hours max)
- **Custom error pages** to avoid leaking information
- **Redis adapter** for session storage (encrypted, expires automatically)

## The Development vs Production Nightmare

OAuth in development is a special kind of frustrating. Google's OAuth requires exact redirect URIs, but your development URL keeps changing. Sometimes it's `localhost:3000`, sometimes it's `localhost:3001`, sometimes it's a Vercel preview URL.

I solved this with dynamic URL detection:

```typescript
// Dynamic URL configuration for OAuth
function getBaseUrl() {
  // In production, use NEXTAUTH_URL environment variable
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }

  // In development, try to detect from various sources
  if (process.env.NODE_ENV === 'development') {
    // Check for explicit PORT environment variable
    if (process.env.PORT) {
      return `http://localhost:${process.env.PORT}`;
    }

    // Check for NEXT_PUBLIC_APP_URL (if set in .env.local)
    if (process.env.NEXT_PUBLIC_APP_URL) {
      return process.env.NEXT_PUBLIC_APP_URL;
    }

    // Default development port
    return 'http://localhost:3000';
  }

  // Fallback to production domain
  return 'https://zachliibbe.com';
}

// Log the detected base URL for debugging
const baseUrl = getBaseUrl();
if (process.env.NODE_ENV === 'development') {
  console.log(`🔗 OAuth Base URL detected: ${baseUrl}`);
}
```

This saved me countless hours of "why isn't OAuth working?" debugging sessions.

## Route Protection: The Middleware Approach

Protecting admin routes was my next challenge. I needed a way to verify authentication on every admin page without duplicating code.

Here's my server-side protection pattern:

```typescript
// /src/lib/auth.ts
export async function getAuthSession() {
  return getServerSession(authOptions);
}

// Used in every admin page
export default async function AdminPage() {
  const session = await getAuthSession();

  if (!session) {
    redirect('/auth/signin');
  }

  return <AdminDashboard session={session} />;
}
```

For API routes, I created a reusable auth check:

```typescript
// API route protection
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Proceed with protected logic
    const postData = await request.json();
    // ...
  } catch (error) {
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
```

## The Environment Variable Security Dance

Managing OAuth credentials securely was surprisingly tricky. You need:

- Google Client ID (can be public)
- Google Client Secret (must stay secret)
- NextAuth Secret (for JWT signing)
- Various redirect URLs

My environment variable strategy:

```bash
# .env.local (never committed)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
NEXTAUTH_SECRET=your_super_secret_jwt_key
NEXTAUTH_URL=http://localhost:3000

# Production (Vercel environment variables)
GOOGLE_CLIENT_ID=prod_client_id
GOOGLE_CLIENT_SECRET=prod_client_secret
NEXTAUTH_SECRET=different_prod_secret
NEXTAUTH_URL=https://zachliibbe.com
```

I also created a verification script to catch missing variables early:

```typescript
// scripts/verify-env.ts
const requiredVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'NEXTAUTH_SECRET',
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars);
  process.exit(1);
}
```

## The Admin Dashboard: Hiding in Plain Sight

I wanted admin functionality that was accessible to me but invisible to everyone else. No obvious "/admin" links in the navigation. No breadcrumbs leading curious visitors to protected areas.

My solution: a subtle approach in the footer:

```typescript
// Only show admin link when authenticated
export default function Footer() {
  const { data: session } = useSession();

  return (
    <footer>
      {/* Normal footer content */}

      {session && (
        <div className={styles.adminSection}>
          <Link href="/admin" className={styles.adminLink}>
            Dashboard
          </Link>
        </div>
      )}
    </footer>
  );
}
```

The admin dashboard itself is designed to look professional but not draw attention:

```typescript
export default function AdminDashboard({ session }: AdminDashboardProps) {
  return (
    <div className="universal-gradient-container">
      <div className="universal-gradient-background" />
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1>Admin Dashboard</h1>
            <div className={styles.userInfo}>
              <span>Welcome, {session.user?.name}</span>
              <button onClick={handleSignOut} className={styles.signOutButton}>
                Sign Out
              </button>
            </div>
          </div>
        </div>

        <div className={styles.dashboard}>
          {/* Dashboard content */}
        </div>
      </div>
    </div>
  );
}
```

## Session Management: The 3-Hour Rule

I chose a 3-hour session timeout as a compromise between security and usability. Long enough that I don't get logged out while writing a blog post, short enough that a compromised session can't do damage for long.

```typescript
session: {
  strategy: 'jwt',
  maxAge: 180 * 60, // 180 minutes = 3 hours
},
```

The JWT strategy means sessions are stateless—no database cleanup needed, and they expire automatically.

## Error Handling: Failing Securely

Security errors need special handling. You want to log enough information for debugging but not leak details to potential attackers:

```typescript
export default async function AdminPage() {
  try {
    const session = await getAuthSession();

    if (!session) {
      redirect('/auth/signin');
    }

    return <AdminDashboard session={session} />;
  } catch (error) {
    // Log detailed error server-side
    console.error('Admin page error:', error);

    // Show generic error to user
    redirect('/auth/signin');
  }
}
```

For the custom error page:

```typescript
// /auth/error/page.tsx
export default function AuthError() {
  return (
    <div className={styles.container}>
      <h1>Access Denied</h1>
      <p>You don't have permission to access this area.</p>
      <Link href="/">Return Home</Link>
    </div>
  );
}
```

## Testing Authentication: The Incognito Window Workflow

Testing auth flows became a daily ritual:

1. **Happy path**: Sign in with my account, verify dashboard access
2. **Unauthorized access**: Try accessing `/admin` while signed out
3. **Wrong user**: Sign in with a different Google account (using incognito)
4. **Session expiry**: Wait 3 hours, verify I get redirected to sign in

The incognito window became my best friend for testing unauthorized access scenarios.

## Monitoring and Alerting: Knowing When Someone's Knocking

I added simple logging to track authentication attempts:

```typescript
callbacks: {
  async signIn({ user, account, profile }) {
    const allowedEmail = 'zliibbe@gmail.com';

    if (user.email === allowedEmail) {
      console.log(`✅ Successful admin login: ${user.email}`);
      return true;
    }

    // Log unauthorized attempts (but don't log email for privacy)
    console.warn(`🚫 Unauthorized access attempt from Google account`);
    return '/auth/error?error=AccessDenied';
  },
},
```

This helped me understand if anyone was trying to access my admin panel.

## The Security Mindset Shift

Building this authentication system changed how I think about security:

1. **Defense in depth**: Multiple layers of protection
2. **Principle of least privilege**: Sessions expire, routes are protected by default
3. **Fail securely**: Errors redirect to safe pages, logs don't leak information
4. **Assume compromise**: Design for when (not if) something goes wrong

## Real-World Results

After 6 months in production:

- **Zero security incidents** (that I know of)
- **No unauthorized access attempts** in the logs
- **Seamless admin workflow** for content management
- **Peace of mind** when checking my admin panel in coffee shops

## What I'd Do Differently

Looking back, I would:

- **Add rate limiting** to auth endpoints earlier
- **Implement 2FA** even for a single-user system
- **Set up security headers** from day one
- **Add automated security scanning** to my deployment pipeline

## The Ongoing Responsibility

Security isn't a feature you build once—it's an ongoing responsibility. I regularly:

- Update dependencies for security patches
- Review authentication logs
- Test the auth flow after any changes
- Keep up with security best practices

## Lessons for Solo Developers

Building secure systems as a solo developer means:

1. **Use proven solutions** (OAuth providers, established libraries)
2. **Keep it simple** (fewer moving parts = fewer vulnerabilities)
3. **Automate testing** (you'll forget to test edge cases manually)
4. **Stay paranoid** (assume attackers are smarter than you)
5. **Plan for incidents** (know how to revoke access quickly)

The complete authentication system is available in my [GitHub repository](https://github.com/zliibbe/zachliibbe.com), and you can see the admin interface in action (if you're me) at [zachliibbe.com/admin](https://zachliibbe.com/admin).

---

_Security is about managing fear through good practices and proven tools. Want to see more stories about building secure systems as a solo developer? Follow my journey as I share the real challenges of implementing authentication without a security team._
