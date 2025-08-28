# Vercel Configuration for Blog Publishing Automation

## Overview

This document outlines the external Vercel configuration required for the automated blog publishing system. These configurations need to be set up in the Vercel dashboard and are external to the codebase.

## 1. Vercel Cron Jobs Configuration

### Required Cron Job Setup

**Location**: Vercel Dashboard → Project → Settings → Functions → Cron Jobs

**Cron Job Configuration**:

```json
{
  "path": "/api/admin/cron/publish",
  "schedule": "0 9 * * *"
}
```

**Details**:

- **Path**: `/api/admin/cron/publish`
- **Schedule**: `0 9 * * *` (Daily at 9:00 AM UTC)
- **Description**: "Automated blog post publishing - checks for scheduled posts due for publication"

### Alternative Configuration (vercel.json)

If you prefer to manage cron jobs via configuration file, add this to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/admin/cron/publish",
      "schedule": "0 9 * * *"
    }
  ]
}
```

## 2. Environment Variables

### Required Environment Variables

The following environment variables are already configured but ensure they're set:

- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `NEXTAUTH_SECRET` - NextAuth.js secret for JWT signing
- `NEXTAUTH_URL` - Base URL for NextAuth.js callbacks
- `KV_REST_API_URL` - Vercel KV REST API URL
- `KV_REST_API_TOKEN` - Vercel KV REST API token

### Optional Environment Variables

- `CRON_SECRET` - Optional secret for securing cron endpoints (recommended for production)
  - **Purpose**: Additional security layer for cron endpoint verification
  - **Setup**: Generate a unique secret and add to your `.env.local` file

## 3. Vercel KV Database

### Current Usage

- Session storage for authentication
- Future: Scheduled post tracking and metadata

### Required Indexes

No special indexes required for the current file-based blog storage approach.

## 4. Deployment Configuration

### Function Configuration

Ensure the cron endpoint has appropriate timeout settings:

```json
{
  "functions": {
    "src/app/api/admin/cron/**": {
      "maxDuration": 30
    }
  }
}
```

## 5. Security Considerations

### Cron Endpoint Protection

1. **IP Verification**: Cron jobs will verify they're called from Vercel's IP ranges
2. **Secret Verification**: Optional CRON_SECRET environment variable for additional security
3. **Rate Limiting**: Built-in protection against excessive calls

### CSRF Protection

Cron endpoints bypass CSRF protection since they're server-to-server calls.

## 6. Monitoring and Logging

### Vercel Analytics

Enable function logs to monitor cron job execution:

- Go to Vercel Dashboard → Project → Functions
- Enable logging for `/api/admin/cron/publish`
- Monitor execution times and error rates

### Error Notifications

Consider setting up:

- Email notifications for failed cron executions
- Slack webhook for publishing notifications
- Health check endpoints for monitoring

## 7. Testing Cron Jobs

### Local Testing

```bash
# Test the cron endpoint locally
curl -X POST http://localhost:3000/api/admin/cron/publish \
  -H "x-vercel-cron: 1" \
  -H "Content-Type: application/json"
```

### Production Testing

```bash
# Manually trigger cron job (if CRON_SECRET is configured)
curl -X POST https://your-domain.vercel.app/api/admin/cron/publish \
  -H "x-vercel-cron: 1" \
  -H "x-cron-secret: $CRON_SECRET" \
  -H "Content-Type: application/json"
```

## 8. Local Environment Setup

### Generate CRON_SECRET

```bash
# Generate a secure random secret (32 characters)
node -e "console.log('CRON_SECRET=' + require('crypto').randomBytes(16).toString('hex'))"
```

### Add to .env.local

Create or update your `.env.local` file:

```bash
# Blog Publishing Automation
CRON_SECRET=your_generated_secret_here
```

### Vercel Environment Variables

In your Vercel Dashboard → Project → Settings → Environment Variables, add:

- **Name**: `CRON_SECRET`
- **Value**: (the same secret from your .env.local)
- **Environment**: Production, Preview, Development

## 9. Setup Checklist

- [ ] Configure cron job in Vercel dashboard (`0 9 * * *`)
- [ ] Generate and set `CRON_SECRET` environment variable (see Local Environment Setup above)
- [ ] Add `CRON_SECRET` to Vercel environment variables in dashboard
- [ ] Verify all required environment variables are set
- [ ] Test cron endpoint manually with secret header
- [ ] Monitor first automated execution
- [ ] Set up error monitoring/alerts
- [ ] Document any custom configuration

## 10. Next Steps

1. **Deploy the cron endpoint** to Vercel
2. **Configure the cron job** in Vercel dashboard
3. **Test with a scheduled post** to verify automation
4. **Monitor logs** for successful execution
5. **Set up alerts** for failed publishing attempts

## 11. Troubleshooting

### Common Issues

1. **Cron job not executing**: Check Vercel dashboard cron configuration
2. **Authentication errors**: Verify environment variables are set correctly
3. **File write permissions**: Ensure Vercel can write to the blog data files
4. **Timezone issues**: Cron runs in UTC, verify scheduling logic accounts for this

### Debug Commands

```bash
# Check if cron job is configured
vercel env ls

# View function logs
vercel logs --follow

# Test function locally
vercel dev
```
