import { MODEL_CONFIG } from "@/config/model-config";
import type { RegressionDay, RegressionResult } from "@/types/fitness";
import { clamp, daysBetween, mean } from "./math";

interface RegressionPoint { x: number; y: number; weight: number }

function weightedFit(points: RegressionPoint[]) {
  const sumW = points.reduce((s, p) => s + p.weight, 0);
  const xBar = points.reduce((s, p) => s + p.x * p.weight, 0) / sumW;
  const yBar = points.reduce((s, p) => s + p.y * p.weight, 0) / sumW;
  const covariance = points.reduce((s, p) => s + p.weight * (p.x - xBar) * (p.y - yBar), 0);
  const variance = points.reduce((s, p) => s + p.weight * (p.x - xBar) ** 2, 0);
  const slope = variance === 0 ? 0 : covariance / variance;
  const intercept = yBar - slope * xBar;
  return { slope, intercept };
}

function robustFit(base: Omit<RegressionPoint, "weight">[]) {
  let points: RegressionPoint[] = base.map((p) => ({ ...p, weight: 1 }));
  let fit = weightedFit(points);
  for (let i = 0; i < 12; i += 1) {
    points = points.map((p) => {
      const residual = p.y - (fit.intercept + fit.slope * p.x);
      const abs = Math.abs(residual);
      const delta = MODEL_CONFIG.regression.huberDeltaKg;
      return { ...p, weight: abs <= delta ? 1 : delta / Math.max(abs, 1e-9) };
    });
    fit = weightedFit(points);
  }
  const residuals = points.map((p) => p.y - (fit.intercept + fit.slope * p.x));
  const yMean = mean(points.map((p) => p.y));
  const ssRes = residuals.reduce((s, r) => s + r ** 2, 0);
  const ssTot = points.reduce((s, p) => s + (p.y - yMean) ** 2, 0);
  return {
    ...fit,
    r2: ssTot === 0 ? 0 : 1 - ssRes / ssTot,
    residualMaeKg: mean(residuals.map(Math.abs)),
  };
}

export function calibrateRollingTdee(
  days: RegressionDay[],
  currentPredictedTdeeKcal: number,
  oldFactor = 1,
): RegressionResult {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const warnings: string[] = [];
  if (sorted.length === 0) {
    return {
      rawFactor: 1, appliedFactor: oldFactor, calibratedTdeeKcal: currentPredictedTdeeKcal * oldFactor,
      confidence: "low", confidenceScore: 0, windowDays: 0, weightPoints: 0,
      intakeCoverage: 0, r2: 0, residualMaeKg: 0, warnings: ["No calibration data available."],
    };
  }

  const startDate = sorted[0].date;
  const endDate = sorted.at(-1)!.date;
  const windowDays = daysBetween(startDate, endDate) + 1;
  const intakeDays = sorted.filter((d) => d.intakeKcal !== undefined).length;
  const intakeCoverage = intakeDays / Math.max(sorted.length, 1);

  let cumulativeIntake = 0;
  let cumulativePredictedBurn = 0;
  const points: Omit<RegressionPoint, "weight">[] = [];
  for (const day of sorted) {
    cumulativeIntake += day.intakeKcal ?? 0;
    cumulativePredictedBurn += day.predictedTdeeKcal;
    if (day.weightKg !== undefined) {
      points.push({
        x: cumulativePredictedBurn / MODEL_CONFIG.energyDensityKcalPerKg,
        y: day.weightKg - cumulativeIntake / MODEL_CONFIG.energyDensityKcalPerKg,
      });
    }
  }

  const enough =
    windowDays >= MODEL_CONFIG.regression.minimumWindowDays &&
    points.length >= MODEL_CONFIG.regression.minimumWeightPoints &&
    intakeDays >= MODEL_CONFIG.regression.minimumIntakeDays &&
    intakeCoverage >= MODEL_CONFIG.regression.minimumIntakeCoverage;

  if (!enough) warnings.push("Calibration needs more complete intake and morning-weight data.");
  if (points.length < 2) {
    return {
      rawFactor: 1, appliedFactor: oldFactor, calibratedTdeeKcal: currentPredictedTdeeKcal * oldFactor,
      confidence: "low", confidenceScore: 0, windowDays, weightPoints: points.length,
      intakeCoverage, r2: 0, residualMaeKg: 0, warnings,
    };
  }

  const fit = robustFit(points);
  const rawFactor = clamp(-fit.slope, MODEL_CONFIG.regression.factorFloor, MODEL_CONFIG.regression.factorCeiling);
  const lengthScore = clamp(windowDays / MODEL_CONFIG.regression.preferredWindowDays, 0, 1);
  const weightScore = clamp(points.length / 21, 0, 1);
  const coverageScore = clamp((intakeCoverage - 0.5) / 0.5, 0, 1);
  const residualScore = clamp(1 - fit.residualMaeKg / 1.2, 0, 1);
  const fitScore = clamp((fit.r2 + 0.2) / 1.2, 0, 1);
  let confidenceScore = lengthScore * 0.25 + weightScore * 0.2 + coverageScore * 0.25 + residualScore * 0.2 + fitScore * 0.1;
  if (!enough) confidenceScore *= 0.35;
  const updateWeight = Math.min(MODEL_CONFIG.regression.maxAppliedUpdateWeight, confidenceScore * 0.5);
  const appliedFactor = oldFactor * (1 - updateWeight) + rawFactor * updateWeight;
  const confidence = confidenceScore >= 0.72 ? "high" : confidenceScore >= 0.42 ? "medium" : "low";
  if (fit.residualMaeKg > 0.9) warnings.push("Large weight noise reduced calibration confidence.");
  if (rawFactor === MODEL_CONFIG.regression.factorFloor || rawFactor === MODEL_CONFIG.regression.factorCeiling) {
    warnings.push("Raw correction reached the ±15% safety cap.");
  }

  return {
    rawFactor,
    appliedFactor,
    calibratedTdeeKcal: currentPredictedTdeeKcal * appliedFactor,
    confidence,
    confidenceScore,
    windowDays,
    weightPoints: points.length,
    intakeCoverage,
    r2: fit.r2,
    residualMaeKg: fit.residualMaeKg,
    warnings,
  };
}
