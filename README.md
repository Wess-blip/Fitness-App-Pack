# FormLab Fitness v1.2 — modular planning and projection app

A mobile-first Next.js PWA for fitness planning, body-composition projection, workout scheduling and optional logging. It is designed for Netlify + Supabase and includes a HealthKit bridge scaffold for Apple Health.

## Main product flow

1. **Setup** — user-specific static profile, dynamic body data, goals, activity modules and model settings.
2. **Plan** — saved 3-day or 6-day PPL schedule with workout graphics.
3. **Projection** — Dashboard Pro-style weight, PBF, LBM, TDEE, intake, deficit and target-date modelling.
4. **Log** — optional food, weight, activity, workout and measurement entries.
5. **Progress** — expandable observed weight/trend and nutrition charts.

Logging improves calibration, but the planning and projection engine works immediately from Setup.

## Built features

- Richer mobile interface with colour-coded metrics and expandable chart panels
- Google login using Supabase OAuth
- Local-first data persistence when signed out
- Automatic Supabase cloud sync when signed in
- Static profile and dynamic baseline setup
- Goal input for fat loss, maintenance, recomp and muscle gain
- Automatic or manual TDEE and calorie target values
- Modular activity modes that prevent double counting:
  - wearable total
  - manual total
  - component-based activity
- Optional treadmill calculation by time or target active calories
- Mifflin, Cunningham and Katch-McArdle calculations with editable normalized weights
- Macro-specific TEF with editable fallback
- Robust rolling TDEE regression with Huber weighting and confidence scoring
- Conservative, expected and optimistic lean-mass scenarios
- Projection target/safety stopping
- Saved PPL scheduling and workout graphics
- Supabase schema, RLS and private storage
- Apple HealthKit bridge scaffold
- Optional food-photo analysis endpoint

## Run locally

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Verify before deployment

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Supabase setup

For a new database:

1. Run `supabase/migrations/001_initial_schema.sql`.
2. Run `supabase/migrations/002_user_app_state_and_auth.sql`.
3. Run `supabase/seed.sql`.

For an existing v1.1 database, run only migration 002.

Then follow `docs/V1_2_UPGRADE.md` to enable Google login and add Netlify environment variables.

## Updating the live site

Read `docs/GITHUB_FOR_BEGINNERS.md`. The normal sequence is:

1. Copy changed files into your cloned GitHub repository.
2. Commit.
3. Push to `main`.
4. Netlify automatically builds and publishes the pushed version.

## Key edit points

- Default user inputs: `src/data/default-app-state.ts`
- Input precedence and linking: `src/lib/app-state/resolve.ts`
- Core formulas: `src/lib/engine/`
- Model safety/configuration: `src/config/model-config.ts`
- Workout templates: `src/data/workout-program.ts`
- App UI: `src/app/` and `src/components/`
- Cloud state/auth migration: `supabase/migrations/002_user_app_state_and_auth.sql`

Increment `engineVersion` whenever a formula or safety boundary changes user recommendations.
