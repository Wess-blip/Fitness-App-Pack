import type { BodyProfile } from "@/types/fitness";
import { clamp } from "./math";

export function estimateNavyBodyFat(profile: BodyProfile): number | undefined {
  const { sex, heightCm, waistCm, neckCm, hipCm } = profile;
  if (!waistCm || !neckCm || !heightCm) return undefined;

  const heightIn = heightCm / 2.54;
  const waistIn = waistCm / 2.54;
  const neckIn = neckCm / 2.54;

  if (sex === "male") {
    if (waistIn <= neckIn) return undefined;
    const pct =
      (86.01 * Math.log10(waistIn - neckIn) -
        70.041 * Math.log10(heightIn) +
        36.76) /
      100;
    return clamp(pct, 0.03, 0.65);
  }

  if (!hipCm) return undefined;
  const hipIn = hipCm / 2.54;
  if (waistIn + hipIn <= neckIn) return undefined;
  const pct =
    (163.205 * Math.log10(waistIn + hipIn - neckIn) -
      97.684 * Math.log10(heightIn) -
      78.387) /
    100;
  return clamp(pct, 0.08, 0.7);
}

export function resolveBodyFat(profile: BodyProfile): {
  bodyFatPct?: number;
  source: "manual" | "navy" | "unknown";
} {
  if (profile.bodyFatPct && profile.bodyFatPct > 0) {
    return { bodyFatPct: clamp(profile.bodyFatPct, 0.03, 0.7), source: "manual" };
  }
  const navy = estimateNavyBodyFat(profile);
  return navy
    ? { bodyFatPct: navy, source: "navy" }
    : { bodyFatPct: undefined, source: "unknown" };
}

export function bodyCompartments(weightKg: number, bodyFatPct?: number): {
  leanMassKg?: number;
  fatMassKg?: number;
} {
  if (bodyFatPct === undefined) return {};
  const fatMassKg = weightKg * bodyFatPct;
  return { fatMassKg, leanMassKg: weightKg - fatMassKg };
}
