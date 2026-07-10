import type { BodyFatConfidence, BodyProfile, CalculationOptions } from "@/types/fitness";
import { bodyCompartments, resolveBodyFat } from "./body-composition";

export interface BmrResult {
  mifflin: number;
  cunningham?: number;
  katchMcArdle?: number;
  hybrid: number;
  weights: { mifflin: number; cunningham: number; katchMcArdle: number };
  leanMassKg?: number;
  bodyFatPct?: number;
}

export function mifflinStJeor(profile: BodyProfile): number {
  const sexAdjustment = profile.sex === "male" ? 5 : -161;
  return 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.ageYears + sexAdjustment;
}
export function cunningham(leanMassKg: number): number { return 500 + 22 * leanMassKg; }
export function katchMcArdle(leanMassKg: number): number { return 370 + 21.6 * leanMassKg; }

function weightsForConfidence(confidence: BodyFatConfidence | undefined) {
  switch (confidence) {
    case "high": return { mifflin: 0.45, cunningham: 0.4, katchMcArdle: 0.15 };
    case "medium": return { mifflin: 0.7, cunningham: 0.3, katchMcArdle: 0 };
    case "low": return { mifflin: 0.85, cunningham: 0.15, katchMcArdle: 0 };
    default: return { mifflin: 1, cunningham: 0, katchMcArdle: 0 };
  }
}
function normalize(weights: NonNullable<CalculationOptions["bmrWeights"]>) {
  const total = Math.max(0, weights.mifflin) + Math.max(0, weights.cunningham) + Math.max(0, weights.katchMcArdle);
  if (total <= 0) return { mifflin: 1, cunningham: 0, katchMcArdle: 0 };
  return { mifflin: Math.max(0, weights.mifflin) / total, cunningham: Math.max(0, weights.cunningham) / total, katchMcArdle: Math.max(0, weights.katchMcArdle) / total };
}

export function calculateBmr(profile: BodyProfile, options: CalculationOptions = {}): BmrResult {
  const resolved = resolveBodyFat(profile);
  const { leanMassKg } = bodyCompartments(profile.weightKg, resolved.bodyFatPct);
  const mifflin = mifflinStJeor(profile);
  const defaultWeights = leanMassKg ? weightsForConfidence(profile.bodyFatConfidence ?? "medium") : weightsForConfidence("none");
  const weights = options.bmrWeights && leanMassKg ? normalize(options.bmrWeights) : defaultWeights;
  const cunninghamValue = leanMassKg ? cunningham(leanMassKg) : undefined;
  const katchValue = leanMassKg ? katchMcArdle(leanMassKg) : undefined;
  const hybrid = mifflin * weights.mifflin + (cunninghamValue ?? 0) * weights.cunningham + (katchValue ?? 0) * weights.katchMcArdle;
  return { mifflin, cunningham: cunninghamValue, katchMcArdle: katchValue, hybrid, weights, leanMassKg, bodyFatPct: resolved.bodyFatPct };
}
