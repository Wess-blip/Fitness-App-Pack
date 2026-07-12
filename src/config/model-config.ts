/**
 * Central, editable model settings.
 * Change values here, increment engineVersion, run `npm test`, and review
 * docs/BACKEND_EDITING.md before deploying.
 */
export const MODEL_CONFIG = {
  engineVersion: "2.0.0",
  energyDensityKcalPerKg: 7700,
  regression: {
    minimumPreviewDays: 14,
    minimumWindowDays: 21,
    preferredWindowDays: 28,
    maximumWindowDays: 42,
    minimumWeightPoints: 10,
    minimumIntakeDays: 10,
    minimumPreviewCoverage: 0.7,
    minimumIntakeCoverage: 0.8,
    factorFloor: 0.85,
    factorCeiling: 1.15,
    maxAppliedUpdateWeight: 0.25,
    huberDeltaKg: 0.6,
  },
  tef: {
    fallbackRate: 0.1,
    proteinRate: 0.25,
    carbsRate: 0.075,
    fatRate: 0.02,
    alcoholRate: 0.15,
  },
  activity: {
    defaultWeightsMet: 4,
    defaultCoreMet: 3.5,
    walkingEquationMinSpeedKmh: 1.9,
    walkingEquationMaxSpeedKmh: 7.9,
  },
  safety: {
    minimumBodyFatPctMale: 0.05,
    minimumBodyFatPctFemale: 0.12,
    minimumCaloriesMale: 1500,
    minimumCaloriesFemale: 1200,
    maximumWeeklyLossPct: 0.01,
    maximumWeeklyGainPct: 0.005,
  },
  projection: {
    maxWeeks: 104,
    fatEnergyDensityKcalPerKg: 9440.7266,
    leanEnergyDensityKcalPerKg: 1816.4436,
  },
} as const;

export type ModelConfig = typeof MODEL_CONFIG;
