import { getServerSession } from 'next-auth/next';
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { UpstashRedisAdapter } from '@next-auth/upstash-redis-adapter';
import { kv } from '@vercel/kv';

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
      // Restrict to single user (zliibbe@gmail.com)
      const allowedEmail = 'zliibbe@gmail.com';

      if (user.email === allowedEmail) {
        return true;
      }

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
    maxAge: 180 * 60, // 180 minutes as per PRD
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  // Dynamic base URL for OAuth redirects
  ...(process.env.NODE_ENV === 'development' && {
    url: baseUrl,
  }),
};

export async function getAuthSession() {
  return getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getAuthSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  return session;
}
