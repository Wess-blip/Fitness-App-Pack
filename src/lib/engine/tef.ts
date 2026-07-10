import { MODEL_CONFIG } from "@/config/model-config";
import type { MacroPlan } from "@/types/fitness";

export function calculateTef(plan: MacroPlan): number {
  const hasMacros =
    plan.proteinG !== undefined &&
    plan.carbsG !== undefined &&
    plan.fatG !== undefined;
  if (!hasMacros) return plan.calories * MODEL_CONFIG.tef.fallbackRate;

  return (
    (plan.proteinG ?? 0) * 4 * MODEL_CONFIG.tef.proteinRate +
    (plan.carbsG ?? 0) * 4 * MODEL_CONFIG.tef.carbsRate +
    (plan.fatG ?? 0) * 9 * MODEL_CONFIG.tef.fatRate +
    (plan.alcoholG ?? 0) * 7 * MODEL_CONFIG.tef.alcoholRate
  );
}
