# OAuth Redirect Fix Guide

## Problem
After deploying to Vercel (findit-ai.vercel.app), Google OAuth redirects users to localhost:3000 instead of the production URL.

## Root Cause
Supabase OAuth redirect URLs need to be configured in the Supabase dashboard to include your production domain.

## Solution

### 1. Configure Supabase Redirect URLs

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **Authentication** → **URL Configuration**
4. Add the following URLs to **Redirect URLs**:

```
http://localhost:3000/auth/callback
https://findit-ai.vercel.app/auth/callback
```

5. Set **Site URL** to:
```
https://findit-ai.vercel.app
```

6. Click **Save**

### 2. Configure Environment Variables in Vercel

1. Go to your Vercel Dashboard: https://vercel.com
2. Select your project (findit-ai)
3. Go to **Settings** → **Environment Variables**
4. Add the following variable:

```
Name: NEXT_PUBLIC_SITE_URL
Value: https://findit-ai.vercel.app
```

5. Make sure it's available for **Production**, **Preview**, and **Development**
6. Redeploy your application

### 3. Local Development Setup

For local development, create/update `.env.local`:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## What Changed in the Code

### 1. Updated `app/(auth)/auth/login/page.tsx`
```tsx
// Before
redirectTo: `${window.location.origin}/auth/callback`

// After
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
redirectTo: `${siteUrl}/auth/callback`
```

### 2. Updated `app/(auth)/auth/callback/page.tsx`
```tsx
// Before
router.push("/dashboard")

// After
router.push("/profile")
```

### 3. Updated `.env.local.example`
Added `NEXT_PUBLIC_SITE_URL` variable

## Testing

### Local Testing
1. Run `npm run dev`
2. Visit http://localhost:3000
3. Click "Sign in with Google"
4. Should redirect to http://localhost:3000/auth/callback

### Production Testing
1. Deploy to Vercel
2. Visit https://findit-ai.vercel.app
3. Click "Sign in with Google"
4. Should redirect to https://findit-ai.vercel.app/auth/callback

## Important Notes

- **Always add both localhost AND production URLs** to Supabase redirect URLs
- The environment variable `NEXT_PUBLIC_SITE_URL` is optional but recommended for better control
- If you change your domain, update both Supabase and Vercel configurations
- After changing Supabase settings, no code changes are needed - just redeploy

## Common Issues

### Issue: Still redirecting to localhost after deploy
**Solution**: 
1. Clear browser cache
2. Check Vercel environment variables are set correctly
3. Verify Supabase redirect URLs include your production domain
4. Redeploy the application

### Issue: OAuth not working at all
**Solution**:
1. Verify Google OAuth is enabled in Supabase Authentication settings
2. Check that Google OAuth credentials are configured in Supabase
3. Ensure redirect URLs match exactly (including trailing slashes)

## Additional Security (Optional)

For extra security in Supabase:

1. Go to **Authentication** → **Providers** → **Google**
2. Under **Google OAuth Scopes**, ensure you have:
   - `email`
   - `profile`
3. Consider enabling **Email Confirmations** for new signups
4. Set **Session Duration** based on your security requirements

## Vercel Preview Deployments

If you want OAuth to work on preview deployments:

1. In Supabase, add a wildcard redirect URL:
```
https://*.vercel.app/auth/callback
```

2. Or add each preview URL individually after deployment

## Monitoring

Check Supabase logs for OAuth issues:
1. Go to **Logs** → **Auth Logs** in Supabase dashboard
2. Look for failed authentication attempts
3. Check error messages for redirect URL mismatches
