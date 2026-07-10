export type SexForFormula = "male" | "female";
export type BodyFatConfidence = "none" | "low" | "medium" | "high";
export type GoalMode = "lose" | "maintain" | "gain" | "recomp";
export type TrainingExperience = "novice" | "intermediate" | "advanced";
export type ActivityMode = "wearable-total" | "manual-total" | "components";
export type CaloriePlanMode = "fixed" | "goal-driven";
export type ProjectionScenario = "conservative" | "expected" | "optimistic";

export interface CalculationOptions {
  bmrWeights?: { mifflin: number; cunningham: number; katchMcArdle: number };
  tefFallbackRate?: number;
}

export interface BodyProfile {
  sex: SexForFormula;
  ageYears: number;
  heightCm: number;
  weightKg: number;
  bodyFatPct?: number;
  bodyFatConfidence?: BodyFatConfidence;
  waistCm?: number;
  neckCm?: number;
  hipCm?: number;
  trainingExperience: TrainingExperience;
}

export interface MacroPlan {
  calories: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  alcoholG?: number;
}

export interface TreadmillModule {
  enabled: boolean;
  speedKmh?: number;
  inclinePct?: number;
  durationMin?: number;
  targetActiveKcal?: number;
  rampMin?: number;
  cooldownActiveKcal?: number;
}

export interface WorkoutActivityInput {
  weightsMinutes?: number;
  weightsMet?: number;
  coreMinutes?: number;
  coreMet?: number;
  treadmill?: TreadmillModule;
  walkActiveKcal?: number;
  manuallyLoggedWorkoutActiveKcal?: number;
}

export interface DailyActivityInput {
  date: string;
  mode: ActivityMode;
  wearableActiveKcal?: number;
  manualTotalActiveKcal?: number;
  baseNonExerciseActiveKcal?: number;
  workout?: WorkoutActivityInput;
  steps?: number;
  source?: "apple-health" | "manual" | "default";
}

export interface DailyNutritionInput extends MacroPlan {
  date: string;
  complete: boolean;
}

export interface WeightObservation {
  date: string;
  weightKg: number;
  source?: "apple-health" | "manual" | "scale-import";
}

export interface GoalSettings {
  mode: GoalMode;
  targetWeightKg?: number;
  targetBodyFatPct?: number;
  targetWeeklyRatePct: number;
  caloriePlanMode: CaloriePlanMode;
  fixedCalories?: number;
  plannedProteinG?: number;
  plannedFatG?: number;
  sessionsPerWeek: number;
  onTarget: "stop" | "maintenance";
}

export interface ActivityDefaults {
  mode: ActivityMode;
  averagePlannedWorkoutAcrossWeek?: boolean;
  workoutDaysPerWeek?: number;
  wearableActiveKcal?: number;
  manualTotalActiveKcal?: number;
  baseNonExerciseActiveKcal?: number;
  workout?: WorkoutActivityInput;
}

export interface RegressionDay {
  date: string;
  intakeKcal?: number;
  predictedTdeeKcal: number;
  weightKg?: number;
}

export interface RegressionResult {
  rawFactor: number;
  appliedFactor: number;
  calibratedTdeeKcal: number;
  confidence: "low" | "medium" | "high";
  confidenceScore: number;
  windowDays: number;
  weightPoints: number;
  intakeCoverage: number;
  r2: number;
  residualMaeKg: number;
  warnings: string[];
}

export interface ProjectionPoint {
  week: number;
  date: string;
  weightKg: number;
  leanMassKg: number;
  fatMassKg: number;
  bodyFatPct: number;
  bmrKcal: number;
  activeKcal: number;
  tefKcal: number;
  tdeeKcal: number;
  calorieTarget: number;
  weeklyWeightChangeKg: number;
  weeklyLeanMassChangeKg: number;
  weeklyFatMassChangeKg: number;
  status: "active" | "target-reached" | "safety-stop" | "maintenance";
}

export interface ProjectionResult {
  scenario: ProjectionScenario;
  points: ProjectionPoint[];
  warnings: string[];
}

export interface ExerciseTemplate {
  id: string;
  name: string;
  setsMin: number;
  setsMax: number;
  repsMin: number;
  repsMax: number;
  targetRir: number;
  restSeconds: number;
  notes: string;
  muscles: string[];
}

export interface ProgramDayTemplate {
  id: "push" | "pull" | "legs";
  name: string;
  image: string;
  exercises: ExerciseTemplate[];
  stretches: string[];
}

export interface ScheduledWorkout {
  weekday: number;
  weekdayLabel: string;
  sequence: number;
  programDayId: ProgramDayTemplate["id"];
  name: string;
}
