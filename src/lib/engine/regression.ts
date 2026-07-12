import { MODEL_CONFIG } from "@/config/model-config";
import type { RegressionDay, RegressionResult } from "@/types/fitness";
import { clamp, daysBetween, mean, median } from "./math";

interface Point { x: number; y: number; weight: number }

function weightedFit(points: Point[]) {
  const sumW = points.reduce((sum, point) => sum + point.weight, 0);
  const xBar = points.reduce((sum, point) => sum + point.x * point.weight, 0) / sumW;
  const yBar = points.reduce((sum, point) => sum + point.y * point.weight, 0) / sumW;
  const covariance = points.reduce((sum, point) => sum + point.weight * (point.x - xBar) * (point.y - yBar), 0);
  const variance = points.reduce((sum, point) => sum + point.weight * (point.x - xBar) ** 2, 0);
  const slope = variance <= 1e-12 ? 0 : covariance / variance;
  return { slope, intercept: yBar - slope * xBar };
}

function robustFit(base: Array<Omit<Point, "weight">>) {
  let points: Point[] = base.map((point) => ({ ...point, weight: 1 }));
  let fit = weightedFit(points);
  for (let iteration = 0; iteration < 24; iteration += 1) {
    const residuals = points.map((point) => point.y - (fit.intercept + fit.slope * point.x));
    const center = median(residuals);
    const mad = median(residuals.map((residual) => Math.abs(residual - center)));
    const delta = Math.max(MODEL_CONFIG.regression.huberDeltaKg, 1.345 * Math.max(0.05, 1.4826 * mad));
    points = points.map((point, index) => {
      const distance = Math.abs(residuals[index]);
      return { ...point, weight: distance <= delta ? 1 : delta / Math.max(distance, 1e-9) };
    });
    const next = weightedFit(points);
    if (Math.abs(next.slope - fit.slope) < 1e-10) { fit = next; break; }
    fit = next;
  }
  const residuals = points.map((point) => point.y - (fit.intercept + fit.slope * point.x));
  const yMean = mean(points.map((point) => point.y));
  const ssRes = residuals.reduce((sum, residual) => sum + residual ** 2, 0);
  const ssTot = points.reduce((sum, point) => sum + (point.y - yMean) ** 2, 0);
  return { ...fit, r2: ssTot <= 1e-12 ? 0 : 1 - ssRes / ssTot, residualMaeKg: mean(residuals.map(Math.abs)) };
}

function emptyResult(currentTdee: number, oldFactor: number, warnings: string[], windowDays = 0, weightPoints = 0, intakeCoverage = 0): RegressionResult {
  const calibrated = currentTdee * oldFactor;
  return {
    status: "learning", rawFactor: oldFactor, appliedFactor: oldFactor, calibratedTdeeKcal: calibrated,
    likelyLowKcal: calibrated * 0.9, likelyHighKcal: calibrated * 1.1,
    confidence: "low", confidenceScore: 0, windowDays, weightPoints, intakeCoverage,
    r2: 0, residualMaeKg: 0, warnings,
  };
}

export function calibrateRollingTdee(days: RegressionDay[], currentPredictedTdeeKcal: number, oldFactor = 1): RegressionResult {
  const unique = new Map(days.map((day) => [day.date, day]));
  const sorted = [...unique.values()].sort((a, b) => a.date.localeCompare(b.date));
  if (!sorted.length) return emptyResult(currentPredictedTdeeKcal, oldFactor, ["Add complete nutrition days and morning weights to start calibration."]);

  const lastDate = sorted.at(-1)!.date;
  const earliest = new Date(`${lastDate}T00:00:00Z`);
  earliest.setUTCDate(earliest.getUTCDate() - MODEL_CONFIG.regression.maximumWindowDays + 1);
  const limited = sorted.filter((day) => day.date >= earliest.toISOString().slice(0, 10));
  const windowDays = daysBetween(limited[0].date, lastDate) + 1;
  const validIntakes = limited.map((day) => day.intakeKcal).filter((value): value is number => typeof value === "number" && value > 0);
  const intakeCoverage = validIntakes.length / Math.max(windowDays, 1);
  const weightPoints = limited.filter((day) => typeof day.weightKg === "number" && day.weightKg > 0).length;
  const canPreview = windowDays >= MODEL_CONFIG.regression.minimumPreviewDays && weightPoints >= MODEL_CONFIG.regression.minimumWeightPoints && validIntakes.length >= MODEL_CONFIG.regression.minimumIntakeDays && intakeCoverage >= MODEL_CONFIG.regression.minimumPreviewCoverage;
  if (!canPreview) return emptyResult(currentPredictedTdeeKcal, oldFactor, [`Learning: ${windowDays} days, ${weightPoints} weigh-ins and ${Math.round(intakeCoverage * 100)}% complete nutrition coverage.`], windowDays, weightPoints, intakeCoverage);

  const typicalIntake = median(validIntakes);
  const byDate = new Map(limited.map((day) => [day.date, day]));
  let cumulativeIntake = 0;
  let cumulativePredictedBurn = 0;
  const points: Array<Omit<Point, "weight">> = [];
  const cursor = new Date(`${limited[0].date}T00:00:00Z`);
  for (let index = 0; index < windowDays; index += 1) {
    const date = cursor.toISOString().slice(0, 10);
    const day = byDate.get(date);
    if (typeof day?.weightKg === "number" && day.weightKg > 0) {
      points.push({ x: cumulativePredictedBurn / MODEL_CONFIG.energyDensityKcalPerKg, y: day.weightKg - cumulativeIntake / MODEL_CONFIG.energyDensityKcalPerKg });
    }
    cumulativeIntake += typeof day?.intakeKcal === "number" && day.intakeKcal > 0 ? day.intakeKcal : typicalIntake;
    cumulativePredictedBurn += typeof day?.predictedTdeeKcal === "number" && day.predictedTdeeKcal > 0 ? day.predictedTdeeKcal : currentPredictedTdeeKcal;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  const fit = robustFit(points);
  const rawFactor = -fit.slope;
  const guardedFactor = clamp(rawFactor, MODEL_CONFIG.regression.factorFloor, MODEL_CONFIG.regression.factorCeiling);
  const canApply = windowDays >= MODEL_CONFIG.regression.minimumWindowDays && intakeCoverage >= MODEL_CONFIG.regression.minimumIntakeCoverage;
  const lengthScore = clamp(windowDays / MODEL_CONFIG.regression.preferredWindowDays, 0, 1);
  const weightScore = clamp(weightPoints / 21, 0, 1);
  const coverageScore = clamp((intakeCoverage - 0.6) / 0.4, 0, 1);
  const residualScore = clamp(1 - fit.residualMaeKg / 1.2, 0, 1);
  let confidenceScore = lengthScore * 0.3 + weightScore * 0.2 + coverageScore * 0.3 + residualScore * 0.2;
  if (!canApply) confidenceScore = Math.min(0.35, confidenceScore);
  const appliedFactor = canApply ? oldFactor + MODEL_CONFIG.regression.maxAppliedUpdateWeight * confidenceScore * (guardedFactor - oldFactor) : oldFactor;
  const confidence = confidenceScore >= 0.72 && windowDays >= 35 ? "high" : confidenceScore >= 0.45 && canApply ? "medium" : "low";
  const calibratedTdeeKcal = currentPredictedTdeeKcal * appliedFactor;
  const uncertainty = Math.max(75, currentPredictedTdeeKcal * Math.max(0.025, fit.residualMaeKg / Math.max(windowDays, 14)));
  const warnings: string[] = [];
  if (!canApply) warnings.push("A preview is available; it will not alter targets until there are 21 days and 80% complete nutrition coverage.");
  if (guardedFactor !== rawFactor) warnings.push("The raw correction exceeded the +/-15% safety guard and was capped.");
  if (fit.residualMaeKg > 0.9) warnings.push("Weight noise reduced calibration confidence.");
  return {
    status: canApply ? "applied" : "preview", rawFactor, appliedFactor, calibratedTdeeKcal,
    likelyLowKcal: Math.max(0, calibratedTdeeKcal - uncertainty), likelyHighKcal: calibratedTdeeKcal + uncertainty,
    confidence, confidenceScore, windowDays, weightPoints, intakeCoverage, r2: fit.r2,
    residualMaeKg: fit.residualMaeKg, warnings,
  };
}
