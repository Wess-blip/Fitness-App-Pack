import { MODEL_CONFIG } from "@/config/model-config";
import type {
  ActivityDefaults,
  DailyActivityInput,
  TreadmillModule,
  WorkoutActivityInput,
} from "@/types/fitness";
import { clamp } from "./math";

export interface TreadmillResult {
  activeKcal: number;
  durationMin: number;
  activeKcalPerMin: number;
  warnings: string[];
}

export function activeCaloriesFromMet(
  weightKg: number,
  minutes: number,
  met: number,
): number {
  if (minutes <= 0 || met <= 1) return 0;
  return (minutes / 60) * weightKg * (met - 1);
}

export function calculateTreadmill(
  weightKg: number,
  module?: TreadmillModule,
): TreadmillResult {
  if (!module?.enabled) {
    return { activeKcal: 0, durationMin: 0, activeKcalPerMin: 0, warnings: [] };
  }

  const speedKmh = module.speedKmh ?? 4;
  const inclinePct = module.inclinePct ?? 0;
  const grade = inclinePct / 100;
  const speedMMin = (speedKmh * 1000) / 60;
  const activeKcalPerMin =
    ((0.1 * speedMMin + 1.8 * speedMMin * grade) * weightKg * 5) / 1000;
  const rampMin = Math.max(0, module.rampMin ?? 0);
  const rampKcalPerMin =
    ((0.1 * speedMMin + 1.8 * speedMMin * (grade / 2)) * weightKg * 5) /
    1000;
  const rampKcal = rampKcalPerMin * rampMin;

  let durationMin = Math.max(0, module.durationMin ?? 0);
  let activeKcal = activeKcalPerMin * durationMin;

  if (module.targetActiveKcal !== undefined && module.targetActiveKcal > 0) {
    const target = module.targetActiveKcal;
    durationMin = target <= rampKcal && rampKcalPerMin > 0
      ? target / rampKcalPerMin
      : rampMin + Math.max(0, (target - rampKcal) / Math.max(activeKcalPerMin, 0.01));
    activeKcal = target;
  } else if (durationMin > 0 && rampMin > 0) {
    const actualRampMinutes = Math.min(durationMin, rampMin);
    const mainMinutes = Math.max(0, durationMin - actualRampMinutes);
    activeKcal = rampKcalPerMin * actualRampMinutes + mainMinutes * activeKcalPerMin;
  }

  activeKcal += Math.max(0, module.cooldownActiveKcal ?? 0);
  const warnings: string[] = [];
  if (
    speedKmh < MODEL_CONFIG.activity.walkingEquationMinSpeedKmh ||
    speedKmh > MODEL_CONFIG.activity.walkingEquationMaxSpeedKmh
  ) {
    warnings.push("Speed is outside the usual ACSM walking-equation range.");
  }

  return {
    activeKcal,
    durationMin,
    activeKcalPerMin,
    warnings,
  };
}

export function calculateWorkoutActiveKcal(
  weightKg: number,
  workout?: WorkoutActivityInput,
): { activeKcal: number; treadmill: TreadmillResult } {
  if (!workout) {
    return {
      activeKcal: 0,
      treadmill: { activeKcal: 0, durationMin: 0, activeKcalPerMin: 0, warnings: [] },
    };
  }
  if (workout.manuallyLoggedWorkoutActiveKcal !== undefined) {
    return {
      activeKcal: Math.max(0, workout.manuallyLoggedWorkoutActiveKcal),
      treadmill: calculateTreadmill(weightKg, { enabled: false }),
    };
  }

  const weights = activeCaloriesFromMet(
    weightKg,
    workout.weightsMinutes ?? 0,
    workout.weightsMet ?? MODEL_CONFIG.activity.defaultWeightsMet,
  );
  const core = activeCaloriesFromMet(
    weightKg,
    workout.coreMinutes ?? 0,
    workout.coreMet ?? MODEL_CONFIG.activity.defaultCoreMet,
  );
  const treadmill = calculateTreadmill(weightKg, workout.treadmill);
  const walk = Math.max(0, workout.walkActiveKcal ?? 0);
  return { activeKcal: weights + core + treadmill.activeKcal + walk, treadmill };
}

/**
 * Prevents double counting by selecting one mutually exclusive activity path.
 * wearable-total and manual-total are treated as complete active-energy totals.
 */
export function resolveDailyActiveCalories(
  weightKg: number,
  input: DailyActivityInput | ActivityDefaults,
): { activeKcal: number; source: string; warnings: string[] } {
  if (input.mode === "wearable-total") {
    const value = Math.max(0, input.wearableActiveKcal ?? 0);
    return {
      activeKcal: value,
      source: "wearable total (workouts already included)",
      warnings: value === 0 ? ["No wearable active-energy value was available."] : [],
    };
  }
  if (input.mode === "manual-total") {
    const value = Math.max(0, input.manualTotalActiveKcal ?? 0);
    return {
      activeKcal: value,
      source: "manual total (workouts already included)",
      warnings: value === 0 ? ["No manual active-energy total was entered."] : [],
    };
  }

  const base = Math.max(0, input.baseNonExerciseActiveKcal ?? 0);
  const workout = calculateWorkoutActiveKcal(weightKg, input.workout);
  const defaults = input as ActivityDefaults;
  const workoutMultiplier = defaults.averagePlannedWorkoutAcrossWeek
    ? clamp(defaults.workoutDaysPerWeek ?? 0, 0, 7) / 7
    : 1;
  return {
    activeKcal: clamp(base + workout.activeKcal * workoutMultiplier, 0, 5000),
    source: defaults.averagePlannedWorkoutAcrossWeek ? "components (weekly plan averaged per day)" : "components",
    warnings: workout.treadmill.warnings,
  };
}
