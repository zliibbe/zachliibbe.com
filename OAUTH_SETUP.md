# OAuth Setup for Development

## Problem

When running the development server on different ports (like `localhost:3003`), Google OAuth fails because the redirect URLs are not properly configured.

## Solution

### 1. Environment Variable Configuration

Add to your `.env.local` file:

```env
# For custom development ports
NEXT_PUBLIC_APP_URL=http://localhost:3003
# OR set the PORT directly
PORT=3003

# NextAuth URL for production
NEXTAUTH_URL=https://zachliibbe.com
```

### 2. Google OAuth App Configuration

In your Google Cloud Console OAuth app, add these authorized redirect URIs:

**For Development:**

- `http://localhost:3000/api/auth/callback/google`
- `http://localhost:3001/api/auth/callback/google`
- `http://localhost:3002/api/auth/callback/google`
- `http://localhost:3003/api/auth/callback/google`
- `http://localhost:4000/api/auth/callback/google`

**For Production:**

- `https://zachliibbe.com/api/auth/callback/google`

### 3. Running with Custom Port

To run on a specific port:

```bash
# Option 1: Set PORT environment variable
PORT=3003 npm run dev

# Option 2: Set in .env.local
echo "NEXT_PUBLIC_APP_URL=http://localhost:3003" >> .env.local
npm run dev -- -p 3003

# Option 3: Direct command
npm run dev -- -p 3003
```

### 4. Verification

The auth system will automatically:

1. Detect the port from `process.env.PORT`
2. Fall back to `process.env.NEXT_PUBLIC_APP_URL`
3. Use default `localhost:3000` if neither is set
4. Use production URL in production environment

### 5. Troubleshooting

If you still get OAuth errors:

1. **Check console logs** for the detected base URL
2. **Verify Google OAuth app** has the correct redirect URI
3. **Clear browser cache** and cookies for localhost
4. **Restart the development server** after changing environment variables

### 6. Testing

To test the OAuth flow:

1. Navigate to `/admin`
2. You should be redirected to Google OAuth
3. After successful authentication, you'll be redirected back to the admin dashboard
