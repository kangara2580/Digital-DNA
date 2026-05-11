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
   http://localhost:3000/auth/callback
   ```

2. Supabase Dashboard > Authentication > URL Configuration

   Local development — set **Site URL** to match how you open the app (prefer `http://localhost:3000` and keep it aligned with `NEXTAUTH_URL` in `.env.local`):

   ```txt
   http://localhost:3000
   ```

   **Additional Redirect URLs** (add every origin you actually use, including `127.0.0.1` if you open the dev server that way):

   ```txt
   http://localhost:3000/auth/callback
   http://127.0.0.1:3000/auth/callback
   ```

   Production — use your real public origin (from `NEXT_PUBLIC_SITE_URL` / your domain), for example:

   ```txt
   https://your-production-domain.example/auth/callback
   ```

3. Supabase Dashboard > Authentication > Providers > Google

   Paste the Google OAuth Client ID and Client Secret from Google Cloud Console.

4. Required environment variables

   ```txt
   NEXT_PUBLIC_SUPABASE_URL=https://ynlfcnezvieqzultbklf.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   NEXTAUTH_URL=http://localhost:3000
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

   This repo does **not** use NextAuth.js; `NEXTAUTH_URL` is still read as the canonical app base URL for OAuth redirects and related helpers (see `src/lib/authAppBaseUrl.ts`, `src/lib/oauthCallbackOrigin.ts`).

## Expected Google login flow

```txt
User clicks Google login
-> /api/auth/google/start
-> Supabase authorize URL
-> Google login
-> https://ynlfcnezvieqzultbklf.supabase.co/auth/v1/callback
-> {NEXTAUTH_URL or current origin}/auth/callback?code=...
-> supabase.auth.exchangeCodeForSession(code)
-> app redirects to the requested page
```
