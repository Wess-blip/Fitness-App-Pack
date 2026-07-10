import { MODEL_CONFIG } from "@/config/model-config";
import type { BodyProfile, GoalSettings } from "@/types/fitness";
import { clamp } from "./math";

export function goalDrivenCalories(profile: BodyProfile, tdeeKcal: number, goal: GoalSettings): number {
  const rawRate = clamp(goal.targetWeeklyRatePct, 0, goal.mode === "gain" ? MODEL_CONFIG.safety.maximumWeeklyGainPct : MODEL_CONFIG.safety.maximumWeeklyLossPct);
  const signedWeeklyChange = goal.mode === "lose" ? -profile.weightKg * rawRate : goal.mode === "gain" ? profile.weightKg * rawRate : 0;
  const target = tdeeKcal + (signedWeeklyChange * MODEL_CONFIG.energyDensityKcalPerKg) / 7;
  const floor = profile.sex === "male" ? MODEL_CONFIG.safety.minimumCaloriesMale : MODEL_CONFIG.safety.minimumCaloriesFemale;
  return Math.max(floor, target);
}

export function resolveMacroPlan(profile: BodyProfile, goal: GoalSettings, tdeeKcal: number) {
  const calories = goal.caloriePlanMode === "fixed" && goal.fixedCalories ? goal.fixedCalories : goalDrivenCalories(profile, tdeeKcal, goal);
  const leanMass = profile.bodyFatPct ? profile.weightKg * (1 - profile.bodyFatPct) : profile.weightKg * 0.75;
  const proteinG = goal.plannedProteinG ?? clamp(leanMass * 2.0, 100, 240);
  const fatG = goal.plannedFatG ?? clamp(profile.weightKg * 0.7, 45, 110);
  const carbsG = Math.max(0, (calories - proteinG * 4 - fatG * 9) / 4);
  return { calories, proteinG, fatG, carbsG };
}
