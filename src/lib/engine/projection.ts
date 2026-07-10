import { MODEL_CONFIG } from "@/config/model-config";
import type { ActivityDefaults, BodyProfile, CalculationOptions, GoalSettings, ProjectionResult, ProjectionScenario } from "@/types/fitness";
import { calculateBmr } from "./bmr";
import { calculateTef } from "./tef";
import { resolveDailyActiveCalories } from "./activity";
import { resolveMacroPlan } from "./nutrition-targets";
import { estimateWeeklyLeanMassChange } from "./lbm";
import { addDays, clamp } from "./math";

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
  const maxWeeks = Math.min(args.weeks ?? 52, MODEL_CONFIG.projection.maxWeeks);
  const warnings: string[] = ["Projection is an estimate; water, glycogen and measurement error can dominate short periods."];
  let weightKg = args.profile.weightKg;
  let bodyFatPct = args.profile.bodyFatPct ?? 0.3;
  let fatMassKg = weightKg * bodyFatPct;
  let leanMassKg = weightKg - fatMassKg;
  const points: ProjectionResult["points"] = [];
  let reached = false;

  for (let week = 0; week <= maxWeeks; week += 1) {
    const profile = { ...args.profile, weightKg, bodyFatPct };
    const bmr = calculateBmr(profile, args.calculationOptions).hybrid;
    const activityScale = weightKg / args.profile.weightKg;
    const scaledActivity: ActivityDefaults = args.activity.mode === "components"
      ? {
          ...args.activity,
          baseNonExerciseActiveKcal: (args.activity.baseNonExerciseActiveKcal ?? 0) * (0.5 + 0.5 * activityScale),
          workout: args.activity.workout ? { ...args.activity.workout, walkActiveKcal: (args.activity.workout.walkActiveKcal ?? 0) * activityScale } : undefined,
        }
      : args.activity;
    const active = resolveDailyActiveCalories(weightKg, scaledActivity).activeKcal;
    const calibrationFactor = args.calibrationFactor ?? 1;
    let tdee = (bmr + active) * calibrationFactor;
    let macroPlan = resolveMacroPlan(profile, args.goal, tdee);
    let tef = calculateTef(macroPlan, args.calculationOptions);
    for (let iteration = 0; iteration < 3; iteration += 1) {
      tdee = (bmr + active + tef) * calibrationFactor;
      macroPlan = resolveMacroPlan(profile, args.goal, tdee);
      tef = calculateTef(macroPlan, args.calculationOptions);
    }
    tdee = (bmr + active + tef) * calibrationFactor;
    const calorieTarget = reached && args.goal.onTarget === "maintenance" ? tdee : macroPlan.calories;
    const dailyBalance = calorieTarget - tdee;
    const weeklyWeightChangeKg = reached ? 0 : (dailyBalance * 7) / MODEL_CONFIG.energyDensityKcalPerKg;
    const deficitPct = Math.max(0, (tdee - calorieTarget) / Math.max(tdee, 1));
    const weeklyLeanMassChangeKg = reached ? 0 : estimateWeeklyLeanMassChange({
      profile,
      leanMassKg,
      bodyFatPct,
      weeklyWeightChangeKg,
      deficitPct,
      proteinG: macroPlan.proteinG,
      sessionsPerWeek: args.goal.sessionsPerWeek,
      scenario,
    });
    const weeklyFatMassChangeKg = weeklyWeightChangeKg - weeklyLeanMassChangeKg;
    const minPbf = profile.sex === "male" ? MODEL_CONFIG.safety.minimumBodyFatPctMale : MODEL_CONFIG.safety.minimumBodyFatPctFemale;
    const targetReached =
      (args.goal.targetWeightKg !== undefined && args.goal.mode === "lose" && weightKg <= args.goal.targetWeightKg) ||
      (args.goal.targetWeightKg !== undefined && args.goal.mode === "gain" && weightKg >= args.goal.targetWeightKg) ||
      (args.goal.targetBodyFatPct !== undefined && bodyFatPct <= args.goal.targetBodyFatPct);
    const safetyStop = bodyFatPct <= minPbf;
    const status = safetyStop ? "safety-stop" : targetReached ? (args.goal.onTarget === "maintenance" ? "maintenance" : "target-reached") : "active";

    points.push({
      week,
      date: addDays(args.startDate, week * 7),
      weightKg,
      leanMassKg,
      fatMassKg,
      bodyFatPct,
      bmrKcal: bmr,
      activeKcal: active,
      tefKcal: tef,
      tdeeKcal: tdee,
      calorieTarget,
      weeklyWeightChangeKg,
      weeklyLeanMassChangeKg,
      weeklyFatMassChangeKg,
      status,
    });

    if (safetyStop || (targetReached && args.goal.onTarget === "stop")) break;
    if (targetReached) reached = true;
    leanMassKg = Math.max(20, leanMassKg + weeklyLeanMassChangeKg);
    fatMassKg = Math.max(0, fatMassKg + weeklyFatMassChangeKg);
    weightKg = leanMassKg + fatMassKg;
    bodyFatPct = clamp(fatMassKg / Math.max(weightKg, 1), 0, 0.7);
  }
  return { scenario, points, warnings };
}
