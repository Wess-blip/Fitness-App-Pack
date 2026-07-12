import { describe, expect, it } from "vitest";
import { DEFAULT_APP_STATE } from "@/data/default-app-state";
import { calibrateRollingTdee, calculateTreadmill, projectBodyComposition } from "@/lib/engine";
import { resolveGoalTargets } from "@/lib/app-state/resolve";
import { cmToDisplay, cmToUnit, displayToCm, displayToKg, fieldUnitsFromSystem, formatInputNumber, kgToDisplay, kgToUnit, kmhToUnit, unitToCm, unitToKg, unitToKmh } from "@/lib/units";
import { demoActivity, demoGoal, demoProfile } from "@/data/demo";
import type { RegressionDay } from "@/types/fitness";

describe("linked goal mathematics", () => {
  it("derives 58.82 kg from 50 kg lean mass at 15% body fat", () => {
    const state = structuredClone(DEFAULT_APP_STATE);
    state.baseline.currentWeightKg = 62.5;
    state.baseline.bodyFatMethod = "manual";
    state.baseline.manualBodyFatPct = 20;
    state.goals.goalDriver = "body-fat";
    state.goals.targetBodyFatPct = 15;
    const target = resolveGoalTargets(state);
    expect(target.targetLeanMassKg).toBeCloseTo(50, 6);
    expect(target.targetWeightKg).toBeCloseTo(58.823529, 5);
  });

  it("derives 16.67% body fat from 50 kg lean mass at 60 kg", () => {
    const state = structuredClone(DEFAULT_APP_STATE);
    state.baseline.currentWeightKg = 62.5;
    state.baseline.bodyFatMethod = "manual";
    state.baseline.manualBodyFatPct = 20;
    state.goals.goalDriver = "weight";
    state.goals.targetWeightKg = 60;
    expect(resolveGoalTargets(state).targetBodyFatPct).toBeCloseTo(1 / 6, 6);
  });

  it("allows a manual target lean-mass assumption without changing current lean mass", () => {
    const state = structuredClone(DEFAULT_APP_STATE);
    state.goals.targetLeanMassMode = "manual";
    state.goals.manualTargetLeanMassKg = 52;
    expect(resolveGoalTargets(state).targetLeanMassKg).toBe(52);
  });
});

describe("unit conversions", () => {
  it("round-trips kg and pounds", () => expect(displayToKg(kgToDisplay(83.4, "imperial"), "imperial")).toBeCloseTo(83.4, 10));
  it("round-trips centimetres and inches", () => expect(displayToCm(cmToDisplay(184.3, "imperial"), "imperial")).toBeCloseTo(184.3, 10));
  it("round-trips each independently selected field unit", () => {
    expect(unitToKg(kgToUnit(83.4, "lb"), "lb")).toBeCloseTo(83.4, 10);
    expect(unitToCm(cmToUnit(39.624, "in"), "in")).toBeCloseTo(39.624, 10);
    expect(unitToKmh(kmhToUnit(8.5, "mph"), "mph")).toBeCloseTo(8.5, 10);
  });
  it("removes floating-point tails from editable values", () => {
    expect(formatInputNumber(15.600000000000001)).toBe("15.6");
    expect(formatInputNumber(216.10000000000002)).toBe("216.1");
  });
  it("keeps independent field choices in the saved state", () => {
    const state = structuredClone(DEFAULT_APP_STATE);
    state.profile.fieldUnits.waist = "in";
    state.profile.fieldUnits.neck = "cm";
    state.profile.fieldUnits.bodyWeight = "lb";
    expect(state.profile.fieldUnits).toMatchObject({ waist: "in", neck: "cm", bodyWeight: "lb" });
  });
  it("migrates the previous universal imperial preference without changing display units", () => {
    expect(fieldUnitsFromSystem("imperial")).toMatchObject({ height: "in", bodyWeight: "lb", waist: "in", treadmillSpeed: "mph" });
  });
});

describe("projection physics and dates", () => {
  it("keeps total weight equal to lean plus fat mass", () => {
    const result = projectBodyComposition({ startDate: "2026-01-01", profile: demoProfile, goal: demoGoal, activity: demoActivity, weeks: 16 });
    for (const point of result.points) expect(point.leanMassKg + point.fatMassKg).toBeCloseTo(point.weightKg, 8);
  });

  it("returns exact ISO dates and includes non-weekly target day", () => {
    const result = projectBodyComposition({ startDate: "2026-01-01", profile: demoProfile, goal: { ...demoGoal, targetBodyFatPct: 0.29 }, activity: demoActivity, weeks: 8 });
    const last = result.points.at(-1)!;
    expect(last.date).toMatch(/^2026-\d{2}-\d{2}$/);
    expect(last.status).not.toBe("active");
  });

  it("handles a treadmill calorie target reached during the ramp", () => {
    const result = calculateTreadmill(80, { enabled: true, speedKmh: 4, inclinePct: 10, targetActiveKcal: 10, rampMin: 10 });
    expect(result.durationMin).toBeLessThan(10);
    expect(result.activeKcal).toBe(10);
  });
});

describe("guarded calibration rollout", () => {
  function days(count: number): RegressionDay[] {
    let weight = 90;
    return Array.from({ length: count }, (_, index) => {
      weight += (2200 - 2800) / 7700;
      return { date: new Date(Date.UTC(2026, 0, index + 1)).toISOString().slice(0, 10), intakeKcal: 2200, predictedTdeeKcal: 2800, weightKg: weight };
    });
  }

  it("shows a preview but does not apply it before 21 days", () => {
    const result = calibrateRollingTdee(days(18), 2800, 1);
    expect(result.status).toBe("preview");
    expect(result.appliedFactor).toBe(1);
  });

  it("applies only a gradual guarded update with enough data", () => {
    const result = calibrateRollingTdee(days(28), 2800, 1);
    expect(result.status).toBe("applied");
    expect(result.appliedFactor).toBeGreaterThanOrEqual(0.85);
    expect(result.appliedFactor).toBeLessThanOrEqual(1.15);
  });
});
