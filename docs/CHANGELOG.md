# Model changelog

## 2.0.0 - linked goals and energy-conserving projection

- Added metric and imperial interface conversions with canonical SI storage.
- Added body-fat-driven and weight-driven linked goal modes.
- Added auto/manual target lean-mass assumptions.
- Reworked projection into daily, exact-date, energy-conserving fat/lean simulation.
- Changed regression to a 14-day preview and guarded 21-day/80%-coverage rollout.
- Added median intake imputation for missing regression days while lowering confidence.
- Corrected treadmill sessions that finish during the ramp period.
- Removed personal default data, demo logs and the paid OpenAI food-photo route.
- Added 10 new engine-v2 tests, for 31 total calculation tests.

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
