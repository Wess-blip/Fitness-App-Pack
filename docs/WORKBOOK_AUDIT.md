# Workbook audit and fixes implemented

Source reviewed: `Fitness Analytics Model V3.xlsx`.

## Retained

- Mifflin, Cunningham and Katch-McArdle equations
- Hybrid BMR concept
- ACSM treadmill logic
- MET-based active calories
- TEF
- Dynamic weekly body-composition projection
- Real-world TDEE calibration concept

## Corrected

### “Regression” replaced

The workbook used a two-point energy-balance estimate based on start weight, end weight and average intake. The app uses all valid points in a rolling window, robust regression, residual diagnostics and confidence-weighted smoothing.

### Activity double count removed

The workbook could treat `Base/day` as an Apple Move total while also adding exercise. The app requires one explicit mode and labels total modes as already including workouts.

### Formula errors removed

The workbook's 7-, 14- and 30-day averages contain `_xludf.MAXIFS` and evaluate as `#NAME?` in the loaded workbook. The app computes rolling periods through database queries and TypeScript aggregation.

### Goal overshoot stopped

The workbook continues projecting after the target body-fat marker. The app stops or moves to maintenance.

### LBM made scenario-based

The workbook contains one heuristic LBM path. The app returns conservative, expected and optimistic outcomes and labels them as uncertain.

### Treadmill made explicit and optional

Blank target fields no longer silently look like a real zero-duration workout. The module has an enabled state and supports time or target calories.

### TEF made modular

The old 10% rule remains as fallback. Macro-specific TEF is used when complete macros are available.

## Golden workbook values preserved in tests

At the workbook profile values:

- Mifflin BMR: 2,021.3339 kcal/day
- Cunningham BMR: 2,025.8398 kcal/day
- Katch-McArdle BMR: 1,868.0972 kcal/day
- Medium-confidence hybrid: 2,022.6857 kcal/day
- Legacy fallback-TEF TDEE: 2,957.3714 kcal/day
