# FormLab v1.2 testing report

Validated on 2026-07-10.

## Automated checks

- TypeScript: passed
- ESLint: passed
- Vitest: 21/21 tests passed
- Next.js production build: passed
- Production route smoke tests: `/`, `/setup`, `/projection`, `/progress`, `/log`, `/login` returned HTTP 200

## Logic covered

- Workbook BMR benchmark parity
- Legacy and macro-specific TEF
- Body-fat estimate safeguards
- Calorie floors and rate caps
- Wearable activity double-count prevention
- Optional treadmill behaviour
- ACSM treadmill calculation
- Robust rolling TDEE regression
- Insufficient-regression-data protection
- Conservative/expected/optimistic LBM ordering
- Projection target stopping
- 3-day and 6-day PPL scheduling
- Auto-linked TDEE recalculation after weight changes
- Manual TDEE and calorie override precedence
- Navy body-fat fallback when measurements are missing
- Wearable activity remains mutually exclusive even when treadmill is enabled

## Remaining real-world validation

Software correctness tests do not prove clinical or predictive accuracy. Real client backtesting is still required for TDEE error, projection intervals, body-composition estimates and adherence assumptions.
