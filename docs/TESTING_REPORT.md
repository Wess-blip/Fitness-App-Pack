# Test and validation report

Generated against app pack **0.1.1** and engine version **1.0.0**.

## Automated results

- Clean lockfile install: **passed** (`npm ci`)
- Unit tests: **17 passed / 17**
- TypeScript: **passed**
- ESLint: **passed**
- Next.js production build: **passed**
- Production HTTP smoke test: **passed**
- PWA manifest HTTP test: **passed**
- Statement coverage: **87.88%**
- Branch coverage: **66.41%**
- Function coverage: **93.33%**
- Line coverage: **90.15%**

## Netlify dependency validation

- Lockfile resolved entries checked: **547**
- Public npm registry entries: **547 / 547**
- Private artifact-registry entries: **0**
- Node used for validation: **22.16.0**
- npm used for validation: **10.9.2**
- Public Supabase JS version pinned: **2.110.0**

## Covered logic

- Workbook BMR benchmarks
- Male and female profile calculations
- Navy body-fat estimate
- Goal-rate caps and calorie floors
- Workbook fallback-TEF TDEE benchmark
- Macro-specific TEF
- Wearable activity double-count prevention
- Optional treadmill
- ACSM treadmill burn
- Duration-based treadmill mode
- Rolling robust calibration against a known synthetic TDEE
- Insufficient-data regression restraint
- LBM scenario ordering
- Projection target stopping
- Three-day and six-day PPL order
- Invalid workout schedule rejection

## Synthetic regression test

The test generates 35 days with:

- Predicted TDEE: 2,900 kcal
- True factor: 0.95
- Intake: 2,200 kcal
- Deterministic daily noise and one 1.2 kg outlier

The robust model must recover the true factor within 0.035 and must not remain low confidence.

## Remaining production validation

Before marketing accuracy claims:

1. Backtest at least several hundred real client-weeks.
2. Report 7-, 14- and 28-day weight-trend MAE.
3. Measure how often actual outcomes fall inside displayed uncertainty ranges.
4. Segment by sex, body-fat range, goal and logging completeness.
5. Review model drift after every engine update.

## Production smoke test

After the production build, `next start` returned HTTP 200 for `/`, the page contained the FormLab application content, and `/manifest.webmanifest` returned HTTP 200 with the expected app name.
