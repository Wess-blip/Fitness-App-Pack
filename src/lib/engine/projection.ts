import { MODEL_CONFIG } from "@/config/model-config";
import type { ActivityDefaults, BodyProfile, CalculationOptions, GoalSettings, ProjectionResult, ProjectionScenario } from "@/types/fitness";
import { calculateBmr } from "./bmr";
import { calculateTef } from "./tef";
import { resolveDailyActiveCalories } from "./activity";
import { resolveMacroPlan } from "./nutrition-targets";
import { addDays, clamp } from "./math";

function scenarioTdeeMultiplier(mode: GoalSettings["mode"], scenario: ProjectionScenario) {
  if (scenario === "expected") return 1;
  const losing = mode === "lose" || mode === "recomp";
  if (scenario === "conservative") return losing ? 0.97 : 1.03;
  return losing ? 1.03 : 0.97;
}

function leanPartition(fatMassKg: number, energyBalance: number, proteinG: number, leanMassKg: number, sessions: number, scenario: ProjectionScenario) {
  const forbes = 10.4 / (10.4 + Math.max(0.1, fatMassKg));
  const support = (clamp(proteinG / Math.max(2.2 * leanMassKg, 1), 0, 1) + clamp(sessions / 4, 0, 1)) / 2;
  if (energyBalance < 0) {
    let fraction = forbes * (1 - 0.45 * support);
    if (scenario === "conservative") fraction *= 1.35;
    if (scenario === "optimistic") fraction *= 0.65;
    return clamp(fraction, 0.01, 0.5);
  }
  let fraction = forbes + (1 - forbes) * 0.25 * support;
  if (scenario === "conservative") fraction *= 0.65;
  if (scenario === "optimistic") fraction *= 1.35;
  return clamp(fraction, 0.02, 0.85);
}

export function reachedProjectionGoal(goal: GoalSettings, initialWeightKg: number, initialBodyFatPct: number, weightKg: number, bodyFatPct: number) {
  const weightReached = goal.targetWeightKg !== undefined && (goal.targetWeightKg <= initialWeightKg ? weightKg <= goal.targetWeightKg : weightKg >= goal.targetWeightKg);
  const bodyFatReached = goal.targetBodyFatPct !== undefined && (goal.targetBodyFatPct <= initialBodyFatPct ? bodyFatPct <= goal.targetBodyFatPct : bodyFatPct >= goal.targetBodyFatPct);
  if (goal.stopMode === "weight") return weightReached;
  if (goal.stopMode === "body-fat") return bodyFatReached;
  if (goal.stopMode === "either") return weightReached || bodyFatReached;
  return weightReached && bodyFatReached;
}

export function projectBodyComposition(args: {
  startDate: string;
  profile: BodyProfile;
  goal: GoalSettings;
  activity: ActivityDefaults;
  calibrationFactor?: number;
  weeks?: number;
  scenario?: ProjectionScenario;
  calculationOptions?: CalculationOptions;
}): ProjectionResult {
  const scenario = args.scenario ?? "expected";
  const maximumDays = Math.min(args.weeks ?? 52, MODEL_CONFIG.projection.maxWeeks) * 7;
  const warnings = ["Projection is a planning range, not a guarantee. Water, glycogen and measurement error can dominate short periods."];
  const initialBodyFatPct = args.profile.bodyFatPct ?? 0.3;
  const initialWeightKg = args.profile.weightKg;
  let fatMassKg = initialWeightKg * initialBodyFatPct;
  let leanMassKg = initialWeightKg - fatMassKg;
  let previousWeeklyWeight = initialWeightKg;
  let previousWeeklyLean = leanMassKg;
  let previousWeeklyFat = fatMassKg;
  const points: ProjectionResult["points"] = [];

  for (let day = 0; day <= maximumDays; day += 1) {
    const weightKg = leanMassKg + fatMassKg;
    const bodyFatPct = fatMassKg / Math.max(weightKg, 1);
    const profile = { ...args.profile, ageYears: args.profile.ageYears + day / 365.2425, weightKg, bodyFatPct };
    const bmr = calculateBmr(profile, args.calculationOptions).hybrid;
    const ratio = weightKg / Math.max(initialWeightKg, 1);
    const scaledActivity: ActivityDefaults = args.activity.mode === "components" ? {
      ...args.activity,
      baseNonExerciseActiveKcal: (args.activity.baseNonExerciseActiveKcal ?? 0) * (0.5 + 0.5 * ratio),
      workout: args.activity.workout ? { ...args.activity.workout, walkActiveKcal: (args.activity.workout.walkActiveKcal ?? 0) * ratio } : undefined,
    } : args.activity;
    const active = resolveDailyActiveCalories(weightKg, scaledActivity).activeKcal;
    const calibration = clamp(args.calibrationFactor ?? 1, 0.75, 1.25);
    let tdee = (bmr + active) * calibration;
    let macros = resolveMacroPlan(profile, args.goal, tdee);
    let tef = calculateTef(macros, args.calculationOptions);
    for (let iteration = 0; iteration < 3; iteration += 1) {
      tdee = (bmr + active + tef) * calibration * scenarioTdeeMultiplier(args.goal.mode, scenario);
      macros = resolveMacroPlan(profile, args.goal, tdee);
      tef = calculateTef(macros, args.calculationOptions);
    }
    tdee = (bmr + active + tef) * calibration * scenarioTdeeMultiplier(args.goal.mode, scenario);
    const targetReached = reachedProjectionGoal(args.goal, initialWeightKg, initialBodyFatPct, weightKg, bodyFatPct);
    const minimumPbf = profile.sex === "male" ? MODEL_CONFIG.safety.minimumBodyFatPctMale : MODEL_CONFIG.safety.minimumBodyFatPctFemale;
    const safetyStop = bodyFatPct <= minimumPbf;
    const status = safetyStop ? "safety-stop" : targetReached ? (args.goal.onTarget === "maintenance" ? "maintenance" : "target-reached") : "active";
    const shouldRecord = day === 0 || day % 7 === 0 || status !== "active" || day === maximumDays;
    if (shouldRecord) {
      points.push({
        day, week: day / 7, date: addDays(args.startDate, day), weightKg, leanMassKg, fatMassKg, bodyFatPct,
        bmrKcal: bmr, activeKcal: active, tefKcal: tef, tdeeKcal: tdee, calorieTarget: status === "maintenance" ? tdee : macros.calories,
        weeklyWeightChangeKg: weightKg - previousWeeklyWeight,
        weeklyLeanMassChangeKg: leanMassKg - previousWeeklyLean,
        weeklyFatMassChangeKg: fatMassKg - previousWeeklyFat,
        status,
      });
      previousWeeklyWeight = weightKg;
      previousWeeklyLean = leanMassKg;
      previousWeeklyFat = fatMassKg;
    }
    if (status !== "active" || day === maximumDays) break;

    const energyBalance = macros.calories - tdee;
    const qLean = leanPartition(fatMassKg, energyBalance, macros.proteinG, leanMassKg, args.goal.sessionsPerWeek, scenario);
    const density = qLean * MODEL_CONFIG.projection.leanEnergyDensityKcalPerKg + (1 - qLean) * MODEL_CONFIG.projection.fatEnergyDensityKcalPerKg;
    const weightChange = energyBalance / density;
    leanMassKg += qLean * weightChange;
    fatMassKg += (1 - qLean) * weightChange;
    if (leanMassKg <= 0 || fatMassKg < 0 || !Number.isFinite(leanMassKg + fatMassKg)) {
      warnings.push("Projection stopped before producing an implausible body-composition state.");
      break;
    }
  }
  if (points.at(-1)?.status === "active") warnings.push("The selected target was not reached within this projection horizon.");
  return { scenario, points, warnings };
}
