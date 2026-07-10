# Netlify deployment

## Required services

- GitHub or another supported Git provider
- Netlify
- Supabase
- Optional OpenAI API key
- Optional Apple Developer account for the HealthKit bridge

## Environment variables

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
OPENAI_API_KEY
MODEL_CRON_SECRET
```

Only the first two are safe for browser exposure. The service key, OpenAI key and cron secret must remain server-side.

## Build configuration included in this pack

The repository already includes:

- `package-lock.json` with public `registry.npmjs.org` tarball URLs
- `.npmrc` forcing the public npm registry and disabling audit/fund/progress during CI installs
- `.nvmrc` pinning Node 22.16.0
- `netlify.toml` pinning Node 22.16.0 and npm 10.9.2
- `npm run build` as the build command
- `.next` as the publish directory

Netlify installs dependencies before it runs the build command. Do **not** change the build command to `npm ci && npm run build`; that performs a second full install after Netlify has already installed dependencies.

## Steps

1. Replace the files in the repository with this corrected release.
2. Commit `package.json`, `package-lock.json`, `.npmrc`, `.nvmrc` and `netlify.toml`.
3. Create a Supabase project and run the migration and seed files.
4. Import the repository into Netlify or trigger a new deploy.
5. Add environment variables under project configuration.
6. Use **Deploy without cache** once after replacing the old lockfile.
7. Test `/api/engine/preview` and authentication in the deploy preview.
8. Confirm the scheduled function appears in Netlify.
9. Add the custom domain only after the preview passes.

## Why the first release timed out

The original lockfile was generated inside a private build environment and all 547 `resolved` package URLs pointed to an internal OpenAI artifact registry. Netlify could not access that registry, so dependency installation waited until the 18-minute timeout. The app source and Next.js compilation were not the cause.

This release changes every lockfile tarball URL to the public npm registry and pins `@supabase/supabase-js` to public version `2.110.0`.

## Verification commands

Run these from the repository root before pushing:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

Check that no private registry URL remains:

```bash
grep -R "internal.api.openai.org\|applied-caas-gateway" package-lock.json .npmrc package.json
```

The command should return no matches.

## If Netlify still stalls

1. Confirm the deploy is using the repository root containing `package.json`.
2. Confirm `package-lock.json` is committed, not generated only on your computer.
3. In Netlify, run **Deploy without cache**.
4. Confirm the build log says Node 22.16.0 and npm 10.9.2.
5. Confirm no Netlify UI environment variable overrides `NODE_VERSION`, `NPM_VERSION`, `NPM_CONFIG_REGISTRY` or `NPM_FLAGS`.
6. Check whether your Git provider stored the old lockfile on another branch.
7. Re-run locally with `npm ci`; do not use `npm install --force`.

## Nightly regression

`netlify/functions/recalculate-models.ts` runs at 03:00 UTC and calls the protected recalculation endpoint. Change the cron schedule if needed.
