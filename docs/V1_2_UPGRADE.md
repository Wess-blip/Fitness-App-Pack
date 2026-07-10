# FormLab v1.2 upgrade

## What changed

- New profile, baseline, goals, activity and model setup module.
- Automatic calculations with explicit manual overrides for TDEE and calorie targets.
- New Dashboard Pro-style Projection page with scenario comparison, expandable charts and a weekly audit table.
- Google login through Supabase OAuth.
- Local-first persistence, with automatic cloud sync when signed in.
- Activity remains mutually exclusive: wearable total, manual total, or calculated components.
- Optional treadmill module remains integrated into activity and projection calculations.
- Richer mobile styling and expandable chart panels.

## Database update

In Supabase SQL Editor, run migrations in order:

1. `supabase/migrations/001_initial_schema.sql` for a new project only.
2. `supabase/migrations/002_user_app_state_and_auth.sql` for both existing and new projects.

## Google sign-in setup

1. In Supabase Dashboard, enable Google under Authentication > Providers.
2. Create a Google OAuth Web application.
3. Add the Supabase callback URL shown by the Google provider page to Google Cloud.
4. In Supabase Authentication > URL Configuration:
   - Set Site URL to the Netlify production URL.
   - Add `https://YOUR-SITE.netlify.app/auth/callback` to Redirect URLs.
   - Add `http://localhost:3000/auth/callback` for local development.
5. Add these Netlify environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY`
6. Trigger a new deploy.

## Data precedence

- Static and planning defaults generate the model.
- Dynamic baseline values replace outdated starting values.
- Daily logs improve progress and calibration.
- A manual override changes only its own resolved value and remains labelled manual.
- Returning a field to Auto immediately reconnects it to the calculation chain.
