import type { ActivityMode, GoalMode, ProjectionScenario, TrainingExperience } from "@/types/fitness";

export type BodyFatMethod = "navy" | "manual" | "assumed";
export type ValueMode = "auto" | "manual";

export interface AppStaticProfile {
  displayName: string;
  birthDate: string;
  sex: "male" | "female";
  heightCm: number;
  trainingExperience: TrainingExperience;
  timezone: string;
  unitSystem: "metric" | "imperial";
}

export interface AppDynamicBaseline {
  startDate: string;
  currentWeightKg: number;
  bodyFatMethod: BodyFatMethod;
  manualBodyFatPct?: number;
  assumedBodyFatPct: number;
  waistCm?: number;
  neckCm?: number;
  hipCm?: number;
  bodyFatConfidence: "none" | "low" | "medium" | "high";
}

export interface AppGoalSetup {
  mode: GoalMode;
  targetWeightKg?: number;
  targetBodyFatPct?: number;
  targetWeeklyRatePct: number;
  caloriePlanMode: "fixed" | "goal-driven";
  fixedCalories?: number;
  plannedProteinG?: number;
  plannedFatG?: number;
  sessionsPerWeek: number;
  onTarget: "stop" | "maintenance";
}

export interface AppActivitySetup {
  mode: ActivityMode;
  wearableActiveKcal?: number;
  manualTotalActiveKcal?: number;
  baseNonExerciseActiveKcal?: number;
  averagePlannedWorkoutAcrossWeek: boolean;
  workoutDaysPerWeek: number;
  weightsMinutes: number;
  weightsMet: number;
  coreMinutes: number;
  coreMet: number;
  walkActiveKcal: number;
  manuallyLoggedWorkoutActiveKcal?: number;
  treadmill: {
    enabled: boolean;
    speedKmh: number;
    inclinePct: number;
    inputMode: "duration" | "target";
    durationMin?: number;
    targetActiveKcal?: number;
    rampMin: number;
    cooldownActiveKcal: number;
  };
}

export interface AppModelSetup {
  bmrWeights: { mifflin: number; cunningham: number; katchMcArdle: number };
  tefMode: "macro" | "flat";
  tefFallbackRate: number;
  calibrationFactor: number;
  tdeeMode: ValueMode;
  manualTdeeKcal?: number;
  calorieTargetMode: ValueMode;
  manualCalorieTargetKcal?: number;
  projectionScenario: ProjectionScenario;
  projectionWeeks: number;
}

export interface AppPlanSetup {
  frequency: 3 | 6;
  weekdays: number[];
}

export interface AppLogEntry {
  id: string;
  type: "Food" | "Weight" | "Activity" | "Workout" | "Measurement";
  title: string;
  numericValue?: number;
  valueText: string;
  date: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface AppState {
  schemaVersion: 2;
  profile: AppStaticProfile;
  baseline: AppDynamicBaseline;
  goals: AppGoalSetup;
  activity: AppActivitySetup;
  model: AppModelSetup;
  plan: AppPlanSetup;
  logs: AppLogEntry[];
  updatedAt: string;
}

export interface ResolvedAppModel {
  ageYears: number;
  bodyFatPct: number;
  leanMassKg: number;
  fatMassKg: number;
  calculatedTdeeKcal: number;
  effectiveTdeeKcal: number;
  calculatedCalorieTargetKcal: number;
  effectiveCalorieTargetKcal: number;
  activeKcal: number;
  gymBurnKcal: number;
  treadmillMinutes: number;
  tdeeSource: "calculated" | "manual";
  calorieSource: "calculated" | "manual";
}
