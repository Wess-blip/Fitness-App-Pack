import type { AppState, ResolvedAppModel } from "@/types/app-state";
import type { ProjectionPoint, ProjectionResult, ProjectionScenario } from "@/types/fitness";
import { projectBodyComposition } from "@/lib/engine";
import { normalizeWeights, resolveAppModel, toActivityDefaults, toBodyProfile, toGoalSettings } from "./resolve";

export type AppProjectionSet = Record<ProjectionScenario, ProjectionResult>;

export function reachedTargetPoint(result: ProjectionResult): ProjectionPoint | undefined {
  return result.points.find((point) => point.status === "target-reached" || point.status === "maintenance");
}

export function projectionEndpoint(result: ProjectionResult): ProjectionPoint {
  return reachedTargetPoint(result) ?? result.points.at(-1)!;
}

/** One canonical projection builder shared by Home, Projection and Progress. */
export function buildAppProjections(state: AppState, suppliedResolved?: ResolvedAppModel) {
  const resolved = suppliedResolved ?? resolveAppModel(state);
  const profile = toBodyProfile(state);
  const baseGoal = toGoalSettings(state);
  const goal = state.model.calorieTargetMode === "manual"
    ? { ...baseGoal, caloriePlanMode: "fixed" as const, fixedCalories: resolved.effectiveCalorieTargetKcal }
    : baseGoal;
  const activity = toActivityDefaults(state);
  const calibrationFactor = resolved.effectiveTdeeKcal / Math.max(resolved.predictedTdeeKcal, 1);
  const calculationOptions = { bmrWeights: normalizeWeights(state.model.bmrWeights), tefFallbackRate: state.model.tefFallbackRate };
  const make = (scenario: ProjectionScenario) => projectBodyComposition({
    startDate: state.baseline.startDate,
    profile,
    goal,
    activity,
    calibrationFactor,
    weeks: state.model.projectionWeeks,
    scenario,
    calculationOptions,
  });
  const projections: AppProjectionSet = {
    conservative: make("conservative"),
    expected: make("expected"),
    optimistic: make("optimistic"),
  };
  return {
    resolved,
    profile,
    goal,
    projections,
    expectedEndpoint: projectionEndpoint(projections.expected),
    expectedTarget: reachedTargetPoint(projections.expected),
  };
}
