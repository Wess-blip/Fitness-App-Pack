# FormLab Fitness — app creation pack

A mobile-first Next.js PWA for client fitness logging, workout planning, calorie/TDEE calculations, rolling regression calibration and body-composition projections. It is designed for Netlify + Supabase and includes an optional iOS HealthKit bridge.

## What is already built

- Simple five-tab phone interface: Home, Log, Plan, Progress and More
- Universal goal engine for fat loss, maintenance, recomp and muscle gain
- Mifflin, Cunningham and Katch-McArdle BMR calculations
- Confidence-weighted hybrid BMR
- Modular activity modes that prevent double counting
- Optional ACSM treadmill module by time or target active calories
- Macro-specific TEF with a 10% fallback
- Robust rolling TDEE regression with Huber weighting and confidence scoring
- Conservative / expected / optimistic LBM projection logic
- Goal and safety stopping conditions
- PPL 3-day or 6-day scheduling with the supplied workout graphics
- Local demo logging so the interface works before Supabase is connected
- Supabase schema, RLS policies and private storage buckets
- Apple HealthKit SwiftUI bridge for weight, active energy, resting energy, steps and workouts
- Optional OpenAI food-photo endpoint
- Automated nightly recalculation endpoint and Netlify scheduled function
- Unit tests, type checks, lint and production build verification

## Run locally

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Verify before every deployment

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Connect Supabase

1. Create a Supabase project.
2. Run `supabase/migrations/001_initial_schema.sql` in the SQL editor.
3. Run `supabase/seed.sql`.
4. Add the variables from `.env.example` to `.env.local` and Netlify.
5. Implement the production auth screens and replace the demo local-storage repository with Supabase calls.

## Deploy to Netlify

1. Push this folder to a private GitHub repository.
2. In Netlify, choose **Add new project → Import an existing project**.
3. Select the repository.
4. Add the environment variables.
5. Deploy. Netlify detects Next.js automatically.

This release pins Node/npm and uses a public-registry lockfile. Do not regenerate `package-lock.json` with a private registry unless you replace private `resolved` URLs before committing.

Read these in order:

1. `docs/MODEL_SPEC.md`
2. `docs/WORKBOOK_AUDIT.md`
3. `docs/BACKEND_EDITING.md`
4. `docs/NETLIFY_DEPLOYMENT.md`
5. `docs/APPLE_HEALTH.md`
6. `docs/TESTING_REPORT.md`

## Key edit points

- Model thresholds: `src/config/model-config.ts`
- Engine formulas: `src/lib/engine/`
- Workout templates: `src/data/workout-program.ts`
- Database: `supabase/migrations/001_initial_schema.sql`
- Mobile UI: `src/app/` and `src/components/`

Increment `engineVersion` whenever a model change can alter user recommendations.
