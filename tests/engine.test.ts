import { describe, expect, it } from "vitest";
import { demoActivity, demoGoal, demoProfile } from "@/data/demo";
import {
  buildPplSchedule,
  calculateBmr,
  calculateTdee,
  calculateTreadmill,
  calibrateRollingTdee,
  estimateWeeklyLeanMassChange,
  projectBodyComposition,
  resolveDailyActiveCalories,
  estimateNavyBodyFat,
  goalDrivenCalories,
} from "@/lib/engine";
import type { RegressionDay } from "@/types/fitness";

const close = (actual: number, expected: number, tolerance = 0.02) => expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);

describe("spreadsheet parity and corrected engine", () => {
  it("matches the workbook BMR benchmarks", () => {
    const result = calculateBmr(demoProfile);
    close(result.mifflin, 2021.333904109589, 0.001);
    close(result.cunningham!, 2025.8397696152003, 0.001);
    close(result.katchMcArdle!, 1868.0972283494696, 0.001);
    close(result.hybrid, 2022.6856637612723, 0.001);
  });

  it("matches the workbook legacy TDEE when macro TEF detail is unavailable", () => {
    const result = calculateTdee(demoProfile, { calories: 2224 }, demoActivity);
    close(result.activeKcal, 712.2857142857143, 0.001);
    close(result.tefKcal, 222.4, 0.001);
    close(result.predictedTdeeKcal, 2957.3713780469866, 0.001);
  });

  it("uses macro-specific TEF when macros are supplied", () => {
    const result = calculateTdee(demoProfile, { calories: 2224, proteinG: 180, carbsG: 238.5, fatG: 70 }, demoActivity);
    close(result.tefKcal, 264.15, 0.01);
    expect(result.predictedTdeeKcal).toBeGreaterThan(2957);
  });
});


describe("profile and calorie safeguards", () => {
  it("produces a plausible Navy estimate for the workbook measurements", () => {
    const estimate = estimateNavyBodyFat({ ...demoProfile, bodyFatPct: undefined });
    close(estimate!, 0.294082919447, 0.00001);
  });

  it("supports the female Mifflin adjustment", () => {
    const result = calculateBmr({ sex: "female", ageYears: 30, heightCm: 165, weightKg: 65, trainingExperience: "novice" });
    close(result.mifflin, 1370.25, 0.01);
  });

  it("caps aggressive weekly loss and applies the calorie floor", () => {
    const calories = goalDrivenCalories({ ...demoProfile, weightKg: 60 }, 1800, { ...demoGoal, targetWeeklyRatePct: 0.05, caloriePlanMode: "goal-driven" });
    expect(calories).toBeGreaterThanOrEqual(1500);
  });
});

describe("activity modules", () => {
  it("does not double count workouts in wearable-total mode", () => {
    const result = resolveDailyActiveCalories(100, {
      mode: "wearable-total",
      wearableActiveKcal: 840,
      workout: { manuallyLoggedWorkoutActiveKcal: 500 },
    });
    expect(result.activeKcal).toBe(840);
  });

  it("keeps the treadmill optional", () => {
    expect(calculateTreadmill(98.25, { enabled: false }).activeKcal).toBe(0);
  });


  it("supports duration-based treadmill logging", () => {
    const result = calculateTreadmill(80, { enabled: true, speedKmh: 4, inclinePct: 8, durationMin: 30, rampMin: 5 });
    expect(result.activeKcal).toBeGreaterThan(150);
    expect(result.durationMin).toBe(30);
  });

  it("reproduces the ACSM active walking burn", () => {
    const result = calculateTreadmill(98.25, { enabled: true, speedKmh: 4, inclinePct: 10, targetActiveKcal: 300, rampMin: 10 });
    close(result.activeKcalPerMin, 9.17, 0.01);
    close(result.activeKcal, 300, 0.01);
    expect(result.durationMin).toBeGreaterThan(30);
  });
});

describe("rolling robust calibration", () => {
  it("recovers a known TDEE factor from noisy synthetic data", () => {
    const predicted = 2900;
    const trueFactor = 0.95;
    const intake = 2200;
    const startWeight = 100;
    const days: RegressionDay[] = [];
    let weight = startWeight;
    for (let i = 0; i < 35; i += 1) {
      weight += (intake - predicted * trueFactor) / 7700;
      const noise = Math.sin(i * 1.7) * 0.22 + (i === 17 ? 1.2 : 0);
      const date = new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10);
      days.push({ date, intakeKcal: intake, predictedTdeeKcal: predicted, weightKg: weight + noise });
    }
    const result = calibrateRollingTdee(days, predicted, 1);
    close(result.rawFactor, trueFactor, 0.035);
    expect(result.confidence).not.toBe("low");
    expect(result.appliedFactor).toBeLessThan(1);
  });

  it("refuses to overreact to insufficient data", () => {
    const result = calibrateRollingTdee([{ date: "2026-01-01", intakeKcal: 2200, predictedTdeeKcal: 2900, weightKg: 100 }], 2900, 1);
    expect(result.appliedFactor).toBe(1);
    expect(result.confidence).toBe("low");
  });
});

describe("LBM and projection", () => {
  it("orders conservative, expected and optimistic LBM outcomes", () => {
    const base = { profile: { ...demoProfile, trainingExperience: "novice" as const }, leanMassKg: 69.3, bodyFatPct: 0.29, weeklyWeightChangeKg: -0.6, deficitPct: 0.12, proteinG: 180, sessionsPerWeek: 3 };
    const conservative = estimateWeeklyLeanMassChange({ ...base, scenario: "conservative" });
    const expected = estimateWeeklyLeanMassChange({ ...base, scenario: "expected" });
    const optimistic = estimateWeeklyLeanMassChange({ ...base, scenario: "optimistic" });
    expect(conservative).toBeLessThanOrEqual(expected);
    expect(expected).toBeLessThanOrEqual(optimistic);
  });

  it("stops once the body-fat target is reached", () => {
    const result = projectBodyComposition({ startDate: "2026-07-10", profile: demoProfile, goal: demoGoal, activity: demoActivity, weeks: 104 });
    const last = result.points.at(-1)!;
    expect(["target-reached", "safety-stop"]).toContain(last.status);
    expect(result.points.length).toBeLessThanOrEqual(105);
  });
});

describe("workout scheduling", () => {
  it("creates a 3-day PPL in weekly order", () => {
    const schedule = buildPplSchedule([6, 2, 4], 3);
    expect(schedule.map((x) => x.programDayId)).toEqual(["push", "pull", "legs"]);
    expect(schedule.map((x) => x.weekday)).toEqual([2, 4, 6]);
  });


  it("creates a 6-day PPL with A and B rotations", () => {
    const schedule = buildPplSchedule([1, 2, 3, 4, 5, 6], 6);
    expect(schedule.map((x) => x.name)).toEqual(["Push A", "Pull A", "Legs + Core A", "Push B", "Pull B", "Legs + Core B"]);
  });

  it("requires exactly the selected frequency", () => {
    expect(() => buildPplSchedule([1, 3], 3)).toThrow();
  });
});

import { DEFAULT_APP_STATE } from "@/data/default-app-state";
import { resolveAppModel, resolveBodyFatPercent, toActivityDefaults } from "@/lib/app-state/resolve";

describe("modular app input precedence", () => {
  it("keeps calculated values linked in auto mode", () => {
    const state = structuredClone(DEFAULT_APP_STATE);
    state.model.tdeeMode = "auto";
    state.model.calorieTargetMode = "auto";
    const first = resolveAppModel(state);
    state.baseline.currentWeightKg = 90;
    const second = resolveAppModel(state);
    expect(second.calculatedTdeeKcal).not.toBe(first.calculatedTdeeKcal);
    expect(second.effectiveTdeeKcal).toBe(second.calculatedTdeeKcal);
  });

  it("uses manual TDEE and calorie overrides without changing other derived values", () => {
    const state = structuredClone(DEFAULT_APP_STATE);
    const auto = resolveAppModel(state);
    state.model.tdeeMode = "manual";
    state.model.manualTdeeKcal = 2800;
    state.model.calorieTargetMode = "manual";
    state.model.manualCalorieTargetKcal = 2100;
    const manual = resolveAppModel(state);
    expect(manual.effectiveTdeeKcal).toBe(2800);
    expect(manual.effectiveCalorieTargetKcal).toBe(2100);
    expect(manual.leanMassKg).toBeCloseTo(auto.leanMassKg, 6);
    expect(manual.calculatedTdeeKcal).toBeCloseTo(auto.calculatedTdeeKcal, 6);
  });

  it("falls back safely when Navy measurements are incomplete", () => {
    const state = structuredClone(DEFAULT_APP_STATE);
    state.baseline.bodyFatMethod = "navy";
    state.baseline.waistCm = undefined;
    state.baseline.assumedBodyFatPct = 31;
    expect(resolveBodyFatPercent(state)).toBeCloseTo(0.31, 6);
  });

  it("preserves mutually exclusive wearable activity mode", () => {
    const state = structuredClone(DEFAULT_APP_STATE);
    state.activity.mode = "wearable-total";
    state.activity.wearableActiveKcal = 900;
    state.activity.treadmill.enabled = true;
    const result = resolveDailyActiveCalories(state.baseline.currentWeightKg, toActivityDefaults(state));
    expect(result.activeKcal).toBe(900);
  });
});
