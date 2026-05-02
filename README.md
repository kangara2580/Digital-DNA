# Digital DNA AEYA

## Google OAuth configuration

The app uses Supabase Auth for Google login. The redirect flow must be configured in two different dashboards.

1. Google Cloud Console > OAuth Client > Authorized redirect URIs

   Use the Supabase Auth callback URL:

   ```txt
   https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback
   ```

   For the current Supabase project:

   ```txt
   https://ynlfcnezvieqzultbklf.supabase.co/auth/v1/callback
   ```

   Do not add the app callback URL here:

   ```txt
   https://ara.pink/auth/callback
   ```

2. Supabase Dashboard > Authentication > URL Configuration

   Site URL:

   ```txt
   https://ara.pink
   ```

   Additional Redirect URLs:

   ```txt
   https://ara.pink/auth/callback
   http://localhost:3001/auth/callback
   ```

3. Supabase Dashboard > Authentication > Providers > Google

   Paste the Google OAuth Client ID and Client Secret from Google Cloud Console.

4. Required environment variables

   ```txt
   NEXT_PUBLIC_SUPABASE_URL=https://ynlfcnezvieqzultbklf.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   NEXT_PUBLIC_SITE_URL=https://ara.pink
   NEXTAUTH_URL=https://ara.pink
   ```

## Expected Google login flow

```txt
User clicks Google login
-> /api/auth/google/start
-> Supabase authorize URL
-> Google login
-> https://ynlfcnezvieqzultbklf.supabase.co/auth/v1/callback
-> https://ara.pink/auth/callback?code=...
-> supabase.auth.exchangeCodeForSession(code)
-> app redirects to the requested page
```
