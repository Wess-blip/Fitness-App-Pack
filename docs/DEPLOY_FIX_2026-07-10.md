# Netlify install-timeout fix — 2026-07-10

## Incident

Netlify stopped in **Initializing → Installing dependencies** after 18 minutes. Building, deploying and post-processing were skipped.

## Confirmed root cause

The committed npm lockfile contained 547 package `resolved` URLs for a private OpenAI artifact registry. Those URLs were valid only inside the environment that generated the first pack and were unreachable from Netlify.

A second issue was found during review: `@supabase/supabase-js` was pinned to `2.110.2`, while the public npm release used for this correction is `2.110.0`.

## Changes made

- Replaced all private lockfile URLs with `https://registry.npmjs.org/` URLs.
- Pinned `@supabase/supabase-js` to `2.110.0`.
- Added `.npmrc` with public-registry and CI-friendly settings.
- Added `.nvmrc` for Node 22.16.0.
- Added package `engines` and `packageManager` metadata.
- Updated `netlify.toml` to pin Node/npm and reduce unnecessary npm network work.
- Kept the Netlify build command as `npm run build` to avoid a duplicate dependency install.
- Added clean-install and deploy troubleshooting documentation.

## Validation

- Clean `npm ci` from the corrected lockfile: passed.
- ESLint: passed.
- TypeScript: passed.
- Engine tests: 17/17 passed.
- Next.js production build: passed.
- Lockfile audit: 547/547 resolved URLs point to the public npm registry.
- Private-registry string scan: no matches in committed source files.
