# Calculation model v2

Engine version: `2.0.0`

## Canonical units

Calculations store kilograms and centimetres. Imperial values are converted only at the interface boundary.

## Body composition

The user selects one source:

- measured/manual body-fat percentage;
- circumference estimate (US Navy equation);
- planning estimate when no reliable measurement exists.

Lean mass = weight x (1 - body-fat fraction).

## Linked goals

The user selects a single goal driver.

- Body-fat driven: target weight = target lean mass / (1 - target body-fat fraction).
- Weight driven: target body fat = 1 - target lean mass / target weight.

Target lean mass is automatic by default and can be manually overridden. Derived targets never overwrite the selected driver.

## BMR and TDEE

The safe default is Mifflin-St Jeor. Advanced users can blend Cunningham or Katch-McArdle when lean-mass confidence is sufficient.

Predicted TDEE = BMR + active calories + thermic effect of food.

Wearable-total, manual-total and component activity modes are mutually exclusive so workouts are not double counted.

## Rolling calibration

For each observed morning weight:

`Y = weight - cumulative intake / 7700`

`X = cumulative predicted expenditure / 7700`

A robust Huber-weighted regression fits `Y = intercept - factor x X`.

- Preview: at least 14 calendar days, 10 weigh-ins, 10 complete nutrition days and 70% coverage.
- Apply: at least 21 days and 80% complete nutrition coverage.
- Data window: maximum 42 days.
- Factor guard: 0.85 to 1.15.
- Applied changes are gradual and confidence weighted.

Missing intake days are imputed with the median complete-day intake for the regression only. They still reduce coverage and confidence.

## Projection

The engine simulates daily and displays weekly points plus the exact target day.

Daily energy balance is partitioned between lean and fat mass using a Forbes-style fraction adjusted by protein, resistance training and scenario. Energy conservation uses separate tissue densities:

- fat: 9440.7266 kcal/kg;
- lean tissue: 1816.4436 kcal/kg.

BMR, activity and TDEE are recalculated as weight changes. Projection stops or transitions at the selected goal driver or safety floor.

The conservative, expected and optimistic scenarios are planning ranges, not accuracy claims.
