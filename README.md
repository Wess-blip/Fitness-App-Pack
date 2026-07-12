# FormLab Fitness v1.3

A mobile-first Next.js planning, projection and logging app for Netlify + Supabase.

## Product flow

1. **Today** - current plan, target path and recommended next action.
2. **Projection** - exact target date, likely date range, body composition and energy plan.
3. **Log** - fast food, weight, measurement and activity entries.
4. **Plan** - editable 3-day or 6-day PPL schedule.
5. **Progress** - observed trends, nutrition, measurements and regression confidence.

Profile and calculation setup are opened from the profile button at the top-right.

## v1.3 highlights

- Metric or imperial display, with canonical kg/cm storage.
- Body-fat setup by measured percentage, circumference calculation or planning estimate.
- Linked goal driver: choose target body fat or target weight; the other updates automatically.
- Auto/manual target lean mass, TDEE, calorie target and activity values.
- Activity dropdown with sport, duration and calculated active calories.
- No-description weight and body-measurement logging.
- Sex-aware measurement list: waist and neck, plus hips for female formulas.
- Exact daily projection dates and conservative/expected/optimistic ranges.
- Energy-conserving fat/lean projection instead of independent mass guesses.
- Rolling robust TDEE regression that previews after 14 days and applies only after 21 days with 80% complete nutrition coverage.
- Paid OpenAI food-photo analysis and the OpenAI package removed.
- Safer PWA caching, security headers and hardened Supabase RLS helper permissions.
- Generic first-run defaults; no personal profile or sample logs are embedded in public source.

## Verify locally

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run build
```

## Deploy

Push a tested commit to the GitHub branch linked to Netlify. Netlify then builds and publishes automatically. See `docs/V1_3_UPDATE_GUIDE.md` for a no-code walkthrough.

## Supabase

The linked production project already has the two dated v1.3 security migrations applied. A fresh project should run migrations in filename order, followed by `supabase/seed.sql`.

## Main edit points

- Inputs and goal linking: `src/lib/app-state/resolve.ts`
- Model safeguards: `src/config/model-config.ts`
- Projection and regression: `src/lib/engine/`
- Screens: `src/app/`
- Workout template: `src/data/workout-program.ts`
- Supabase migrations: `supabase/migrations/`

Increment `MODEL_CONFIG.engineVersion` whenever a formula or safety boundary changes recommendations.
