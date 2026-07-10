# Model changelog

## 1.0.0

- Ported workbook formulas into pure TypeScript.
- Added modular activity modes and double-count protection.
- Added optional treadmill module.
- Added macro-specific TEF.
- Replaced two-point calibration with robust rolling regression.
- Added confidence scoring and smoothed factor updates.
- Added conservative, expected and optimistic LBM scenarios.
- Added goal and safety stopping conditions.

## 1.0.1 — Netlify deployment correction

- Replaced private artifact-registry URLs in `package-lock.json` with public npm URLs.
- Pinned public `@supabase/supabase-js` version 2.110.0.
- Pinned Node 22.16.0 and npm 10.9.2 for Netlify.
- Added deterministic npm/Netlify install configuration.
- Added deployment incident and troubleshooting documentation.
- Revalidated lint, typecheck, 17 engine tests and the production build.
