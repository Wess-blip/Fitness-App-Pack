import type { AppState, ResolvedAppModel } from "@/types/app-state";
import type { ActivityDefaults, BodyProfile, GoalSettings } from "@/types/fitness";
import { calculateTdee, calculateTreadmill, calculateWorkoutActiveKcal, estimateNavyBodyFat, goalDrivenCalories } from "@/lib/engine";

export function ageFromBirthDate(birthDate: string, onDate = new Date()): number {
  const birth = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return 30;
  return Math.max(13, (onDate.getTime() - birth.getTime()) / (365.2425 * 24 * 60 * 60 * 1000));
}

export function normalizeWeights(weights: AppState["model"]["bmrWeights"]) {
  const clean = {
    mifflin: Math.max(0, weights.mifflin || 0),
    cunningham: Math.max(0, weights.cunningham || 0),
    katchMcArdle: Math.max(0, weights.katchMcArdle || 0),
  };
  const total = clean.mifflin + clean.cunningham + clean.katchMcArdle;
  return total > 0
    ? { mifflin: clean.mifflin / total, cunningham: clean.cunningham / total, katchMcArdle: clean.katchMcArdle / total }
    : { mifflin: 1, cunningham: 0, katchMcArdle: 0 };
}

export function resolveBodyFatPercent(state: AppState): number {
  const fallback = Math.max(3, Math.min(65, state.baseline.assumedBodyFatPct)) / 100;
  if (state.baseline.bodyFatMethod === "manual" && state.baseline.manualBodyFatPct !== undefined) {
    return Math.max(0.03, Math.min(0.65, state.baseline.manualBodyFatPct / 100));
  }
  if (state.baseline.bodyFatMethod === "navy") {
    const navy = estimateNavyBodyFat({
      sex: state.profile.sex,
      ageYears: ageFromBirthDate(state.profile.birthDate),
      heightCm: state.profile.heightCm,
      weightKg: state.baseline.currentWeightKg,
      waistCm: state.baseline.waistCm,
      neckCm: state.baseline.neckCm,
      hipCm: state.baseline.hipCm,
      trainingExperience: state.profile.trainingExperience,
    });
    if (navy !== undefined && Number.isFinite(navy)) return navy;
  }
  return fallback;
}

export function toBodyProfile(state: AppState): BodyProfile {
  return {
    sex: state.profile.sex,
    ageYears: ageFromBirthDate(state.profile.birthDate),
    heightCm: state.profile.heightCm,
    weightKg: state.baseline.currentWeightKg,
    bodyFatPct: resolveBodyFatPercent(state),
    bodyFatConfidence: state.baseline.bodyFatConfidence,
    waistCm: state.baseline.waistCm,
    neckCm: state.baseline.neckCm,
    hipCm: state.baseline.hipCm,
    trainingExperience: state.profile.trainingExperience,
  };
}

export function toGoalSettings(state: AppState): GoalSettings {
  return {
    mode: state.goals.mode,
    targetWeightKg: state.goals.targetWeightKg,
    targetBodyFatPct: state.goals.targetBodyFatPct === undefined ? undefined : state.goals.targetBodyFatPct / 100,
    targetWeeklyRatePct: state.goals.targetWeeklyRatePct / 100,
    caloriePlanMode: state.goals.caloriePlanMode,
    fixedCalories: state.goals.fixedCalories,
    plannedProteinG: state.goals.plannedProteinG,
    plannedFatG: state.goals.plannedFatG,
    sessionsPerWeek: state.goals.sessionsPerWeek,
    onTarget: state.goals.onTarget,
  };
}

export function toActivityDefaults(state: AppState): ActivityDefaults {
  const t = state.activity.treadmill;
  return {
    mode: state.activity.mode,
    wearableActiveKcal: state.activity.wearableActiveKcal,
    manualTotalActiveKcal: state.activity.manualTotalActiveKcal,
    baseNonExerciseActiveKcal: state.activity.baseNonExerciseActiveKcal,
    averagePlannedWorkoutAcrossWeek: state.activity.averagePlannedWorkoutAcrossWeek,
    workoutDaysPerWeek: state.activity.workoutDaysPerWeek,
    workout: {
      weightsMinutes: state.activity.weightsMinutes,
      weightsMet: state.activity.weightsMet,
      coreMinutes: state.activity.coreMinutes,
      coreMet: state.activity.coreMet,
      walkActiveKcal: state.activity.walkActiveKcal,
      manuallyLoggedWorkoutActiveKcal: state.activity.manuallyLoggedWorkoutActiveKcal,
      treadmill: {
        enabled: t.enabled,
        speedKmh: t.speedKmh,
        inclinePct: t.inclinePct,
        durationMin: t.inputMode === "duration" ? t.durationMin : undefined,
        targetActiveKcal: t.inputMode === "target" ? t.targetActiveKcal : undefined,
        rampMin: t.rampMin,
        cooldownActiveKcal: t.cooldownActiveKcal,
      },
    },
  };
}

export function resolveAppModel(state: AppState): ResolvedAppModel {
  const profile = toBodyProfile(state);
  const goal = toGoalSettings(state);
  const activity = toActivityDefaults(state);
  const bmrWeights = normalizeWeights(state.model.bmrWeights);
  const provisionalCalories = goal.fixedCalories ?? state.model.manualCalorieTargetKcal ?? 2200;
  const provisionalProtein = goal.plannedProteinG;
  const provisionalFat = goal.plannedFatG;
  const provisionalCarbs = provisionalProtein !== undefined && provisionalFat !== undefined
    ? Math.max(0, (provisionalCalories - provisionalProtein * 4 - provisionalFat * 9) / 4)
    : undefined;
  const tdee = calculateTdee(profile, {
    calories: provisionalCalories,
    proteinG: state.model.tefMode === "macro" ? provisionalProtein : undefined,
    fatG: state.model.tefMode === "macro" ? provisionalFat : undefined,
    carbsG: state.model.tefMode === "macro" ? provisionalCarbs : undefined,
  }, activity, { bmrWeights, tefFallbackRate: state.model.tefFallbackRate });
  const calibrated = tdee.predictedTdeeKcal * Math.max(0.5, Math.min(1.5, state.model.calibrationFactor));
  const effectiveTdeeKcal = state.model.tdeeMode === "manual" && state.model.manualTdeeKcal
    ? state.model.manualTdeeKcal
    : calibrated;
  const calculatedCalorieTargetKcal = goal.caloriePlanMode === "fixed" && goal.fixedCalories
    ? goal.fixedCalories
    : goalDrivenCalories(profile, effectiveTdeeKcal, goal);
  const effectiveCalorieTargetKcal = state.model.calorieTargetMode === "manual" && state.model.manualCalorieTargetKcal
    ? state.model.manualCalorieTargetKcal
    : calculatedCalorieTargetKcal;
  const bodyFatPct = profile.bodyFatPct ?? 0.3;
  const leanMassKg = profile.weightKg * (1 - bodyFatPct);
  const workout = calculateWorkoutActiveKcal(profile.weightKg, activity.workout);
  const treadmill = calculateTreadmill(profile.weightKg, activity.workout?.treadmill);
  return {
    ageYears: profile.ageYears,
    bodyFatPct,
    leanMassKg,
    fatMassKg: profile.weightKg - leanMassKg,
    calculatedTdeeKcal: calibrated,
    effectiveTdeeKcal,
    calculatedCalorieTargetKcal,
    effectiveCalorieTargetKcal,
    activeKcal: tdee.activeKcal,
    gymBurnKcal: workout.activeKcal,
    treadmillMinutes: treadmill.durationMin,
    tdeeSource: state.model.tdeeMode === "manual" && state.model.manualTdeeKcal ? "manual" : "calculated",
    calorieSource: state.model.calorieTargetMode === "manual" && state.model.manualCalorieTargetKcal ? "manual" : "calculated",
  };
}

export function sevenDayAverages(state: AppState) {
  const food = state.logs.filter((entry) => entry.type === "Food").sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);
  const avg = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : undefined;
  return {
    calories: avg(food.map((entry) => entry.numericValue).filter((v): v is number => v !== undefined)),
    protein: avg(food.map((entry) => entry.metadata?.proteinG).filter((v): v is number => typeof v === "number")),
    days: food.length,
  };
}
