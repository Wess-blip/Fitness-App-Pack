import type { ActivityMode, GoalMode, ProjectionScenario, TrainingExperience } from "@/types/fitness";

export type BodyFatMethod = "navy" | "manual" | "assumed";
export type ValueMode = "auto" | "manual";
export type GoalDriver = "body-fat" | "weight";
export type GoalStopMode = "weight" | "body-fat" | "either" | "both";
export type WeightUnit = "kg" | "lb";
export type LengthUnit = "cm" | "in";
export type SpeedUnit = "kmh" | "mph";

export interface AppFieldUnits {
  height: LengthUnit;
  bodyWeight: WeightUnit;
  waist: LengthUnit;
  neck: LengthUnit;
  hips: LengthUnit;
  targetWeight: WeightUnit;
  targetLeanMass: WeightUnit;
  logWeight: WeightUnit;
  logMeasurement: LengthUnit;
  treadmillSpeed: SpeedUnit;
}

export interface AppStaticProfile {
  displayName: string;
  birthDate: string;
  sex: "male" | "female";
  heightCm: number;
  trainingExperience: TrainingExperience;
  timezone: string;
  /** Legacy chart/display preference. Input fields use fieldUnits independently. */
  unitSystem: "metric" | "imperial";
  fieldUnits: AppFieldUnits;
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
  goalDriver: GoalDriver;
  targetLeanMassMode: ValueMode;
  manualTargetLeanMassKg?: number;
  targetWeightKg?: number;
  targetBodyFatPct?: number;
  targetWeeklyRatePct: number;
  caloriePlanMode: "fixed" | "goal-driven";
  fixedCalories?: number;
  plannedProteinG?: number;
  plannedFatG?: number;
  sessionsPerWeek: number;
  stopMode: GoalStopMode;
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
  schemaVersion: 4;
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
  predictedTdeeKcal: number;
  calculatedTdeeKcal: number;
  effectiveTdeeKcal: number;
  calculatedCalorieTargetKcal: number;
  effectiveCalorieTargetKcal: number;
  activeKcal: number;
  gymBurnKcal: number;
  treadmillMinutes: number | null;
  targetLeanMassKg: number;
  targetWeightKg: number;
  targetBodyFatPct: number;
  goalDriver: GoalDriver;
  calibration: {
    status: "learning" | "preview" | "applied";
    confidence: "low" | "medium" | "high";
    confidenceScore: number;
    calendarDays: number;
    weightPoints: number;
    intakeCoverage: number;
    appliedFactor: number;
    likelyLowKcal: number;
    likelyHighKcal: number;
    warnings: string[];
  };
  tdeeSource: "calculated" | "manual";
  calorieSource: "calculated" | "manual";
}
