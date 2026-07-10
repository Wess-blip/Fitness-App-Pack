# Editing the backend safely

## Simple parameter changes

Edit `src/config/model-config.ts` for:

- Regression minimum data
- Factor caps
- Huber outlier threshold
- TEF rates
- Treadmill validity warnings
- Calorie and body-fat safety floors
- Projection horizon

Then:

1. Increment `engineVersion`.
2. Add or change a test.
3. Run lint, typecheck, tests and build.
4. Add a changelog entry.
5. Deploy to a Netlify preview first.

## Formula changes

Pure functions live in `src/lib/engine/`. They do not depend on React or Supabase. This makes them easy to unit-test.

## Workout changes

Edit `src/data/workout-program.ts`. The graphics are references only; structured data drives the app.

## Organization-specific model overrides

The `model_settings` table allows versioned JSON overrides by organization. Keep code defaults as the safe fallback. Add an admin approval workflow before allowing live edits to affect clients.

## Database changes

Create a new numbered SQL migration. Never rewrite a migration that has already been applied to production.

## Historical integrity

Do not silently recompute historical recommendations with a new engine. Store `engine_version`, inputs and outputs for each model run.
