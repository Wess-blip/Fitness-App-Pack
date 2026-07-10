import type { ActivityDefaults, BodyProfile, MacroPlan } from "@/types/fitness";
import { calculateBmr } from "./bmr";
import { resolveDailyActiveCalories } from "./activity";
import { calculateTef } from "./tef";

export interface TdeeResult {
  bmrKcal: number;
  activeKcal: number;
  tefKcal: number;
  predictedTdeeKcal: number;
  activitySource: string;
  warnings: string[];
}

export function calculateTdee(
  profile: BodyProfile,
  nutrition: MacroPlan,
  activity: ActivityDefaults,
): TdeeResult {
  const bmr = calculateBmr(profile);
  const active = resolveDailyActiveCalories(profile.weightKg, activity);
  const tefKcal = calculateTef(nutrition);
  return {
    bmrKcal: bmr.hybrid,
    activeKcal: active.activeKcal,
    tefKcal,
    predictedTdeeKcal: bmr.hybrid + active.activeKcal + tefKcal,
    activitySource: active.source,
    warnings: active.warnings,
  };
}
