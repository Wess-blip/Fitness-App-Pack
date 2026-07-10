import type { BodyFatConfidence, BodyProfile } from "@/types/fitness";
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
  return (
    10 * profile.weightKg +
    6.25 * profile.heightCm -
    5 * profile.ageYears +
    sexAdjustment
  );
}

export function cunningham(leanMassKg: number): number {
  return 500 + 22 * leanMassKg;
}

export function katchMcArdle(leanMassKg: number): number {
  return 370 + 21.6 * leanMassKg;
}

function weightsForConfidence(confidence: BodyFatConfidence | undefined) {
  switch (confidence) {
    case "high":
      return { mifflin: 0.45, cunningham: 0.4, katchMcArdle: 0.15 };
    case "medium":
      return { mifflin: 0.7, cunningham: 0.3, katchMcArdle: 0 };
    case "low":
      return { mifflin: 0.85, cunningham: 0.15, katchMcArdle: 0 };
    default:
      return { mifflin: 1, cunningham: 0, katchMcArdle: 0 };
  }
}

export function calculateBmr(profile: BodyProfile): BmrResult {
  const resolved = resolveBodyFat(profile);
  const { leanMassKg } = bodyCompartments(profile.weightKg, resolved.bodyFatPct);
  const mifflin = mifflinStJeor(profile);
  const weights = leanMassKg
    ? weightsForConfidence(profile.bodyFatConfidence ?? "medium")
    : weightsForConfidence("none");
  const cunninghamValue = leanMassKg ? cunningham(leanMassKg) : undefined;
  const katchValue = leanMassKg ? katchMcArdle(leanMassKg) : undefined;
  const hybrid =
    mifflin * weights.mifflin +
    (cunninghamValue ?? 0) * weights.cunningham +
    (katchValue ?? 0) * weights.katchMcArdle;

  return {
    mifflin,
    cunningham: cunninghamValue,
    katchMcArdle: katchValue,
    hybrid,
    weights,
    leanMassKg,
    bodyFatPct: resolved.bodyFatPct,
  };
}
