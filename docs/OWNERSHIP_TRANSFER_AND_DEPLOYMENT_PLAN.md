# Ownership Transfer and Deployment Plan

## Current State

- Local code: This folder is the only place where the latest backend, admin, Supabase, Kling, and Gemini changes exist.
- GitHub remote: `origin` still points to `kangara2580/Digital-DNA`, so this is not yet a repository owned by Youngho.
- Git commits: The latest local edits are not committed yet.
- Vercel: The local folder is linked to Youngho's Vercel project `digital-dna-aeya-live`.
- Supabase: Environment variables for Supabase are present locally and in the Youngho Vercel project.
- GitHub to Vercel auto deploy: Not connected for the new Youngho-owned source repository yet.

## Target Architecture

```text
Youngho-owned GitHub repository
  -> Youngho-owned Vercel project
  -> Supabase project
  -> Google/Kling/Gemini provider settings
```

This makes GitHub the source of truth. After that, code changes should be committed and pushed to GitHub, and Vercel should deploy from that repository.

## Migration Steps

1. Keep secrets out of Git
   - Do not commit `.env`, `.env.local`, `.vercel`, local database files, logs, or uploaded local files.
   - Commit `.env.example` only as a safe template.

2. Commit the current local code
   - Include admin pages, backend API changes, Prisma/Supabase schema files, and operational docs.
   - Exclude local-only files and previous Vercel backup files.

3. Create a Youngho-owned GitHub repository
   - Recommended repository name: `digital-dna-aeya`
   - Visibility: private until launch readiness is confirmed.

4. Change Git remote
   - Rename the old `origin` to `kangara`.
   - Add the new Youngho repository as `origin`.

5. Push the first operating baseline
   - Push `main` to the new repository.
   - Confirm the GitHub repository contains no secret files.

6. Connect Vercel to GitHub
   - In Vercel, connect `digital-dna-aeya-live` to the new GitHub repository.
   - Confirm production build uses the repository's `main` branch.

7. Lock the final public URL
   - Decide one production domain.
   - Use that URL in:
     - Vercel environment variables
     - Supabase Auth Site URL
     - Supabase Auth Redirect URLs
     - Google OAuth authorized redirect settings if needed

## Verification Checklist

- `npm run build` passes locally.
- GitHub has the latest code and no secret files.
- Vercel production deployment is triggered from GitHub.
- Production URL opens without Vercel Access Required.
- Google login returns to the final production URL, not a preview URL.
- Supabase `auth.users` receives login users.
- Supabase `profiles` receives site profile rows after login.
- Admin pages read real Supabase-backed data.
