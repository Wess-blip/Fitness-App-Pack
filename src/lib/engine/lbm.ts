import type { BodyProfile, ProjectionScenario } from "@/types/fitness";
import { clamp } from "./math";

export interface LeanMassChangeInput {
  profile: BodyProfile;
  leanMassKg: number;
  bodyFatPct: number;
  weeklyWeightChangeKg: number;
  deficitPct: number;
  proteinG: number;
  sessionsPerWeek: number;
  scenario: ProjectionScenario;
}

export function estimateWeeklyLeanMassChange(input: LeanMassChangeInput): number {
  const proteinPerKgLbm = input.proteinG / Math.max(input.leanMassKg, 1);
  const proteinScore = clamp(proteinPerKgLbm / 2.2, 0, 1);
  const trainingScore = clamp(input.sessionsPerWeek / 4, 0, 1);
  const experienceFactor = input.profile.trainingExperience === "novice" ? 1 : input.profile.trainingExperience === "intermediate" ? 0.55 : 0.25;
  const scenarioMultiplier = input.scenario === "conservative" ? 0.65 : input.scenario === "optimistic" ? 1.35 : 1;

  if (input.weeklyWeightChangeKg < 0) {
    const loss = Math.abs(input.weeklyWeightChangeKg);
    let leanFraction =
      0.05 +
      Math.max(0, 0.23 - input.bodyFatPct) * 0.9 +
      clamp(input.deficitPct, 0, 0.35) * 0.22 -
      proteinScore * 0.055 -
      trainingScore * 0.04;
    if (input.scenario === "conservative") leanFraction += 0.06;
    if (input.scenario === "optimistic") leanFraction -= 0.03;
    leanFraction = clamp(leanFraction, 0.02, 0.35);

    const recompEligible =
      input.bodyFatPct >= 0.22 &&
      input.profile.trainingExperience === "novice" &&
      input.deficitPct <= 0.16 &&
      proteinScore >= 0.8 &&
      input.sessionsPerWeek >= 3;
    if (recompEligible && input.scenario !== "conservative") {
      const gain = (input.scenario === "optimistic" ? 0.03 : 0.01) * trainingScore;
      return gain;
    }
    return -loss * leanFraction;
  }

  if (input.weeklyWeightChangeKg > 0) {
    const monthlyRate = input.profile.trainingExperience === "novice" ? 0.006 : input.profile.trainingExperience === "intermediate" ? 0.003 : 0.0015;
    const potential = (input.profile.weightKg * monthlyRate / 4.345) * proteinScore * trainingScore * experienceFactor * scenarioMultiplier;
    return Math.min(input.weeklyWeightChangeKg * 0.85, Math.max(0, potential));
  }

  const maintenanceGain = input.profile.trainingExperience === "novice" ? 0.025 : input.profile.trainingExperience === "intermediate" ? 0.012 : 0.005;
  return maintenanceGain * proteinScore * trainingScore * scenarioMultiplier;
}
