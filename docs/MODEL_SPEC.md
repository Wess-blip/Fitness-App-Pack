# Model specification v1.0.0

## 1. Core principle

The spreadsheet is a reference and test oracle, not the production backend. All calculations are pure TypeScript functions with an explicit engine version. Each saved model run should contain an input snapshot and output snapshot.

## 2. Body composition

The engine accepts a manual body-fat estimate or derives a US Navy circumference estimate when the required measurements exist. It stores source and confidence separately. Lean mass and fat mass are:

```text
fat mass = weight × body-fat fraction
lean mass = weight − fat mass
```

## 3. BMR

```text
Mifflin male   = 10W + 6.25H − 5A + 5
Mifflin female = 10W + 6.25H − 5A − 161
Cunningham     = 500 + 22 × LBM
Katch-McArdle  = 370 + 21.6 × LBM
```

Hybrid weights depend on body-fat confidence:

| Confidence | Mifflin | Cunningham | Katch |
|---|---:|---:|---:|
| None | 100% | 0% | 0% |
| Low | 85% | 15% | 0% |
| Medium | 70% | 30% | 0% |
| High | 45% | 40% | 15% |

## 4. Activity modes

Activity is mutually exclusive at the daily level:

1. `wearable-total`: use Apple Health / wearable active energy. Workouts are already included.
2. `manual-total`: use one manually entered active-energy total. Workouts are already included.
3. `components`: add non-exercise activity plus calculated or manually logged workout components.

This design fixes the original risk of adding a total Apple Move value and separate gym calories.

A default weekly plan can average planned workout burn over seven days. A manually logged day does not average the session.

## 5. MET activity

```text
active kcal = (MET − 1) × body weight kg × hours
```

The resting 1 MET is removed so active calories can be added to BMR without double counting rest.

## 6. Treadmill module

The module is optional. Disabled means zero by design.

ACSM walking calculation:

```text
speed m/min = speed km/h × 1000 / 60
active kcal/min = (0.1 × speed + 1.8 × speed × grade) × kg × 5 / 1000
```

The user can enter either duration or a target active-calorie burn. Ramp time is modelled at half the target grade. Cooldown active calories can be added separately.

## 7. Thermic effect of food

When macros are known:

```text
TEF = protein kcal × 25%
    + carbohydrate kcal × 7.5%
    + fat kcal × 2%
    + alcohol kcal × 15%
```

When macros are incomplete, TEF defaults to 10% of intake.

## 8. Predicted TDEE

```text
predicted TDEE = hybrid BMR + active calories + TEF
```

## 9. Robust rolling calibration

Minimum requirements:

- 14 calendar days
- 10 morning-weight observations
- 10 completed intake days
- 70% intake coverage

Preferred window: 28–42 days.

For each weight date `t`:

```text
Yt = weight_t − cumulative intake_t / 7700
Xt = cumulative predicted burn_t / 7700
Yt = intercept − factor × Xt + error
```

The negative regression slope estimates the burn calibration factor. The fit uses iterative Huber weighting to reduce the influence of water spikes and outliers.

Controls:

- Raw factor capped to 0.85–1.15
- Confidence based on window length, weight count, logging coverage, residual error and fit quality
- Applied factor blends old and raw factors; maximum update weight is 50%
- Low-quality data reduces the update toward zero

## 10. Goal-driven calories

```text
weekly target change = current weight × selected weekly rate
calorie target = calibrated TDEE + weekly target change × 7700 / 7
```

Loss is negative; gain is positive. The rate is capped by model safety settings. Fixed-calorie mode is also supported.

## 11. LBM change scenarios

The engine does not claim to predict individual muscle gain exactly. It produces three scenario bands.

Loss-phase lean-mass risk responds to:

- Body-fat level
- Deficit severity
- Protein relative to LBM
- Resistance-training frequency
- Training experience

A small recomp gain is allowed only under restrictive conditions: higher body fat, novice status, mild deficit, high protein and at least three training sessions.

Gain-phase LBM is capped by surplus, training experience, protein and training frequency. Remaining scale gain becomes fat mass.

## 12. Projection

Each week recalculates:

- Weight, fat mass and LBM
- Body-fat fraction
- BMR
- Activity burn
- TEF
- TDEE
- Calorie target

The projection stops or switches to maintenance when target weight or target body fat is reached. A sex-specific body-fat safety floor is enforced. Maximum horizon is 104 weeks.

## 13. Workout progression

The initial progression rule is double progression:

- Reach the top of the rep range on all work sets with at least 1 RIR → suggest the next load increment
- Stay in range → keep load
- Repeated regression → check recovery and consider reduced volume or deload
- Sharp pain → stop and flag for review

Recommendations require user confirmation.
