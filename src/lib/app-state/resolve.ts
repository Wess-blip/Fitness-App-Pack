import type { AppState, ResolvedAppModel } from "@/types/app-state";
import type { ActivityDefaults, BodyProfile, GoalSettings, RegressionDay } from "@/types/fitness";
import { calculateTdee, calculateTreadmill, calculateWorkoutActiveKcal, calibrateRollingTdee, estimateNavyBodyFat, goalDrivenCalories } from "@/lib/engine";

const DAY_MS = 86_400_000;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function ageFromBirthDate(birthDate: string, onDate = new Date()): number {
  const birth = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return 30;
  return Math.max(18, (onDate.getTime() - birth.getTime()) / (365.2425 * DAY_MS));
}

export function normalizeWeights(weights: AppState["model"]["bmrWeights"]) {
  const clean = { mifflin: Math.max(0, weights.mifflin || 0), cunningham: Math.max(0, weights.cunningham || 0), katchMcArdle: Math.max(0, weights.katchMcArdle || 0) };
  const total = clean.mifflin + clean.cunningham + clean.katchMcArdle;
  return total > 0 ? { mifflin: clean.mifflin / total, cunningham: clean.cunningham / total, katchMcArdle: clean.katchMcArdle / total } : { mifflin: 1, cunningham: 0, katchMcArdle: 0 };
}

export function resolveBodyFatPercent(state: AppState): number {
  const fallback = clamp(state.baseline.assumedBodyFatPct, 3, 65) / 100;
  if (state.baseline.bodyFatMethod === "manual" && state.baseline.manualBodyFatPct !== undefined) return clamp(state.baseline.manualBodyFatPct / 100, 0.03, 0.65);
  if (state.baseline.bodyFatMethod === "navy") {
    const estimate = estimateNavyBodyFat({ sex: state.profile.sex, ageYears: ageFromBirthDate(state.profile.birthDate), heightCm: state.profile.heightCm, weightKg: state.baseline.currentWeightKg, waistCm: state.baseline.waistCm, neckCm: state.baseline.neckCm, hipCm: state.baseline.hipCm, trainingExperience: state.profile.trainingExperience });
    if (estimate !== undefined && Number.isFinite(estimate)) return estimate;
  }
  return fallback;
}

export function toBodyProfile(state: AppState): BodyProfile {
  return { sex: state.profile.sex, ageYears: ageFromBirthDate(state.profile.birthDate), heightCm: state.profile.heightCm, weightKg: state.baseline.currentWeightKg, bodyFatPct: resolveBodyFatPercent(state), bodyFatConfidence: state.baseline.bodyFatConfidence, waistCm: state.baseline.waistCm, neckCm: state.baseline.neckCm, hipCm: state.baseline.hipCm, trainingExperience: state.profile.trainingExperience };
}

export function resolveGoalTargets(state: AppState, currentLeanMassKg?: number) {
  const bodyFatPct = resolveBodyFatPercent(state);
  const currentLean = currentLeanMassKg ?? state.baseline.currentWeightKg * (1 - bodyFatPct);
  const targetLeanMassKg = state.goals.targetLeanMassMode === "manual" && state.goals.manualTargetLeanMassKg && state.goals.manualTargetLeanMassKg > 0 ? state.goals.manualTargetLeanMassKg : currentLean;
  if (state.goals.goalDriver === "weight") {
    const targetWeightKg = Math.max(targetLeanMassKg / 0.97, state.goals.targetWeightKg ?? state.baseline.currentWeightKg);
    return { targetLeanMassKg, targetWeightKg, targetBodyFatPct: clamp(1 - targetLeanMassKg / targetWeightKg, 0.03, 0.65), goalDriver: "weight" as const };
  }
  const targetBodyFatPct = clamp((state.goals.targetBodyFatPct ?? 20) / 100, 0.03, 0.65);
  return { targetLeanMassKg, targetWeightKg: targetLeanMassKg / (1 - targetBodyFatPct), targetBodyFatPct, goalDriver: "body-fat" as const };
}

export function toGoalSettings(state: AppState): GoalSettings {
  const targets = resolveGoalTargets(state);
  return { mode: state.goals.mode, goalDriver: targets.goalDriver, targetWeightKg: targets.targetWeightKg, targetBodyFatPct: targets.targetBodyFatPct, targetWeeklyRatePct: state.goals.targetWeeklyRatePct / 100, caloriePlanMode: state.goals.caloriePlanMode, fixedCalories: state.goals.fixedCalories, plannedProteinG: state.goals.plannedProteinG, plannedFatG: state.goals.plannedFatG, sessionsPerWeek: state.goals.sessionsPerWeek, stopMode: state.goals.stopMode, onTarget: state.goals.onTarget };
}

export function toActivityDefaults(state: AppState): ActivityDefaults {
  const treadmill = state.activity.treadmill;
  return { mode: state.activity.mode, wearableActiveKcal: state.activity.wearableActiveKcal, manualTotalActiveKcal: state.activity.manualTotalActiveKcal, baseNonExerciseActiveKcal: state.activity.baseNonExerciseActiveKcal, averagePlannedWorkoutAcrossWeek: state.activity.averagePlannedWorkoutAcrossWeek, workoutDaysPerWeek: state.activity.workoutDaysPerWeek, workout: { weightsMinutes: state.activity.weightsMinutes, weightsMet: state.activity.weightsMet, coreMinutes: state.activity.coreMinutes, coreMet: state.activity.coreMet, walkActiveKcal: state.activity.walkActiveKcal, manuallyLoggedWorkoutActiveKcal: state.activity.manuallyLoggedWorkoutActiveKcal, treadmill: { enabled: treadmill.enabled, speedKmh: treadmill.speedKmh, inclinePct: treadmill.inclinePct, durationMin: treadmill.inputMode === "duration" ? treadmill.durationMin : undefined, targetActiveKcal: treadmill.inputMode === "target" ? treadmill.targetActiveKcal : undefined, rampMin: treadmill.rampMin, cooldownActiveKcal: treadmill.cooldownActiveKcal } } };
}

export function dailyNutritionSummaries(state: AppState) {
  const grouped = new Map<string, typeof state.logs>();
  state.logs.filter((entry) => entry.type === "Food" && typeof entry.numericValue === "number").forEach((entry) => grouped.set(entry.date, [...(grouped.get(entry.date) ?? []), entry]));
  return [...grouped.entries()].map(([date, entries]) => {
    const dayTotal = entries.find((entry) => entry.metadata?.dayTotal === true);
    const used = dayTotal ? [dayTotal] : entries;
    return { date, calories: used.reduce((sum, entry) => sum + (entry.numericValue ?? 0), 0), protein: used.reduce((sum, entry) => sum + (typeof entry.metadata?.proteinG === "number" ? entry.metadata.proteinG : 0), 0), complete: Boolean(dayTotal) };
  }).sort((a, b) => a.date.localeCompare(b.date));
}

function regressionDays(state: AppState, predictedTdeeKcal: number): RegressionDay[] {
  const nutrition = new Map(dailyNutritionSummaries(state).filter((day) => day.complete).map((day) => [day.date, day.calories]));
  const weights = new Map(state.logs.filter((entry) => entry.type === "Weight" && typeof entry.numericValue === "number").map((entry) => [entry.date, entry.numericValue!]));
  const dates = [...new Set([...nutrition.keys(), ...weights.keys()])].sort();
  if (!dates.length) return [];
  const start = new Date(`${dates[0]}T00:00:00Z`);
  const end = new Date(`${dates.at(-1)}T00:00:00Z`);
  const result: RegressionDay[] = [];
  for (let cursor = start; cursor <= end; cursor = new Date(cursor.getTime() + DAY_MS)) {
    const date = cursor.toISOString().slice(0, 10);
    result.push({ date, predictedTdeeKcal, intakeKcal: nutrition.get(date), weightKg: weights.get(date) });
  }
  return result;
}

export function resolveAppModel(state: AppState): ResolvedAppModel {
  const profile = toBodyProfile(state);
  const targets = resolveGoalTargets(state, profile.weightKg * (1 - (profile.bodyFatPct ?? 0.3)));
  const goal = toGoalSettings(state);
  const activity = toActivityDefaults(state);
  const provisionalCalories = goal.fixedCalories ?? 2200;
  const carbs = goal.plannedProteinG !== undefined && goal.plannedFatG !== undefined ? Math.max(0, (provisionalCalories - goal.plannedProteinG * 4 - goal.plannedFatG * 9) / 4) : undefined;
  const tdee = calculateTdee(profile, { calories: provisionalCalories, proteinG: state.model.tefMode === "macro" ? goal.plannedProteinG : undefined, fatG: state.model.tefMode === "macro" ? goal.plannedFatG : undefined, carbsG: state.model.tefMode === "macro" ? carbs : undefined }, activity, { bmrWeights: normalizeWeights(state.model.bmrWeights), tefFallbackRate: state.model.tefFallbackRate });
  const calibration = calibrateRollingTdee(regressionDays(state, tdee.predictedTdeeKcal), tdee.predictedTdeeKcal, clamp(state.model.calibrationFactor, 0.85, 1.15));
  const calculatedTdeeKcal = calibration.calibratedTdeeKcal;
  const effectiveTdeeKcal = state.model.tdeeMode === "manual" && state.model.manualTdeeKcal ? state.model.manualTdeeKcal : calculatedTdeeKcal;
  const calculatedCalorieTargetKcal = goal.caloriePlanMode === "fixed" && goal.fixedCalories ? goal.fixedCalories : goalDrivenCalories(profile, effectiveTdeeKcal, goal);
  const effectiveCalorieTargetKcal = state.model.calorieTargetMode === "manual" && state.model.manualCalorieTargetKcal ? state.model.manualCalorieTargetKcal : calculatedCalorieTargetKcal;
  const bodyFatPct = profile.bodyFatPct ?? 0.3;
  const leanMassKg = profile.weightKg * (1 - bodyFatPct);
  const workout = calculateWorkoutActiveKcal(profile.weightKg, activity.workout);
  const treadmill = calculateTreadmill(profile.weightKg, activity.workout?.treadmill);
  return {
    ageYears: profile.ageYears, bodyFatPct, leanMassKg, fatMassKg: profile.weightKg - leanMassKg,
    predictedTdeeKcal: tdee.predictedTdeeKcal, calculatedTdeeKcal, effectiveTdeeKcal,
    calculatedCalorieTargetKcal, effectiveCalorieTargetKcal, activeKcal: tdee.activeKcal,
    gymBurnKcal: workout.activeKcal, treadmillMinutes: state.activity.treadmill.enabled ? treadmill.durationMin : null,
    targetLeanMassKg: targets.targetLeanMassKg, targetWeightKg: targets.targetWeightKg, targetBodyFatPct: targets.targetBodyFatPct,
    goalDriver: targets.goalDriver,
    calibration: { status: calibration.status, confidence: calibration.confidence, confidenceScore: calibration.confidenceScore, calendarDays: calibration.windowDays, weightPoints: calibration.weightPoints, intakeCoverage: calibration.intakeCoverage, appliedFactor: calibration.appliedFactor, likelyLowKcal: calibration.likelyLowKcal, likelyHighKcal: calibration.likelyHighKcal, warnings: calibration.warnings },
    tdeeSource: state.model.tdeeMode === "manual" && state.model.manualTdeeKcal ? "manual" : "calculated",
    calorieSource: state.model.calorieTargetMode === "manual" && state.model.manualCalorieTargetKcal ? "manual" : "calculated",
  };
}

export function sevenDayAverages(state: AppState) {
  const summaries = dailyNutritionSummaries(state);
  const end = new Date();
  const start = new Date(end.getTime() - 6 * DAY_MS).toISOString().slice(0, 10);
  const recent = summaries.filter((day) => day.date >= start && day.date <= end.toISOString().slice(0, 10));
  const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : undefined;
  return { calories: average(recent.map((day) => day.calories)), protein: average(recent.map((day) => day.protein)), days: recent.length, completeDays: recent.filter((day) => day.complete).length };
}
