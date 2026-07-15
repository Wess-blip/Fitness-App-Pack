import type { ActivityDefaults, BodyProfile, GoalSettings } from "@/types/fitness";

export const demoProfile: BodyProfile = {
  sex: "male",
  ageYears: 23.6082191781,
  heightCm: 184.3,
  weightKg: 98.25,
  bodyFatPct: 0.294082919447,
  bodyFatConfidence: "medium",
  waistCm: 42.5 * 2.54,
  neckCm: 15.6 * 2.54,
  trainingExperience: "intermediate",
};

export const demoGoal: GoalSettings = {
  mode: "lose",
  goalDriver: "body-fat",
  targetWeightKg: 82,
  targetBodyFatPct: 0.15,
  targetWeeklyRatePct: 0.0075,
  caloriePlanMode: "fixed",
  fixedCalories: 2224,
  plannedProteinG: 180,
  plannedFatG: 70,
  sessionsPerWeek: 3,
  stopMode: "body-fat",
  onTarget: "stop",
};

export const demoActivity: ActivityDefaults = {
  mode: "components",
  averagePlannedWorkoutAcrossWeek: true,
  workoutDaysPerWeek: 3,
  baseNonExerciseActiveKcal: 600,
  workout: {
    weightsMinutes: 45,
    weightsMet: 4,
    coreMinutes: 10,
    coreMet: 3.5,
    treadmill: { enabled: false },
  },
};

export const demoWeightTrend = [
  { date: "2026-06-19", weight: 99.1 },
  { date: "2026-06-22", weight: 97.2 },
  { date: "2026-06-26", weight: 97.6 },
  { date: "2026-06-30", weight: 97.1 },
  { date: "2026-07-04", weight: 98.25 },
  { date: "2026-07-08", weight: 97.7 },
];
