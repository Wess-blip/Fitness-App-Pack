import { NextResponse } from "next/server";
import { MODEL_CONFIG } from "@/config/model-config";
import { calculateTdee, calibrateRollingTdee } from "@/lib/engine";
import { createServiceClient } from "@/lib/supabase/server";
import type { ActivityDefaults, BodyProfile, RegressionDay } from "@/types/fitness";

export const runtime = "nodejs";

function ageOn(birthDate: string, date: string) {
  return (new Date(`${date}T00:00:00Z`).getTime() - new Date(`${birthDate}T00:00:00Z`).getTime()) / 31_557_600_000;
}

export async function POST(request: Request) {
  if (request.headers.get("x-model-cron-secret") !== process.env.MODEL_CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = createServiceClient();
  const { data: profiles, error } = await supabase.from("profiles").select("user_id,sex_for_formula,birth_date,height_cm,body_fat_confidence,training_experience,activity_defaults").not("sex_for_formula", "is", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const results: Array<{ userId: string; status: string; factor?: number }> = [];

  for (const row of profiles ?? []) {
    const end = new Date();
    const start = new Date(end); start.setUTCDate(start.getUTCDate() - 41);
    const startIso = start.toISOString().slice(0, 10);
    const endIso = end.toISOString().slice(0, 10);
    const [{ data: measurements }, { data: nutrition }, { data: activity }, { data: previous }] = await Promise.all([
      supabase.from("measurements").select("measured_at,weight_kg,manual_body_fat_pct").eq("user_id", row.user_id).gte("measured_at", `${startIso}T00:00:00Z`).order("measured_at"),
      supabase.from("daily_nutrition").select("log_date,calories,protein_g,carbs_g,fat_g,complete").eq("user_id", row.user_id).gte("log_date", startIso).lte("log_date", endIso).order("log_date"),
      supabase.from("daily_activity").select("log_date,mode,wearable_active_kcal,manual_total_active_kcal,base_non_exercise_active_kcal,workout").eq("user_id", row.user_id).gte("log_date", startIso).lte("log_date", endIso).order("log_date"),
      supabase.from("calibration_runs").select("applied_factor").eq("user_id", row.user_id).order("calculated_at", { ascending: false }).limit(1),
    ]);
    if (!measurements?.length || !row.birth_date || !row.height_cm || !row.sex_for_formula) {
      results.push({ userId: row.user_id, status: "insufficient profile or weight data" }); continue;
    }

    const weightByDate = new Map<string, { weight: number; pbf?: number }>();
    for (const m of measurements) if (m.weight_kg) weightByDate.set(String(m.measured_at).slice(0, 10), { weight: Number(m.weight_kg), pbf: m.manual_body_fat_pct ? Number(m.manual_body_fat_pct) : undefined });
    const nutritionByDate = new Map((nutrition ?? []).map((n) => [String(n.log_date), n]));
    const activityByDate = new Map((activity ?? []).map((a) => [String(a.log_date), a]));
    let lastWeight = Number(measurements[0].weight_kg);
    let lastPbf = measurements[0].manual_body_fat_pct ? Number(measurements[0].manual_body_fat_pct) : undefined;
    const regressionDays: RegressionDay[] = [];

    for (let cursor = new Date(`${startIso}T00:00:00Z`); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
      const date = cursor.toISOString().slice(0, 10);
      const observed = weightByDate.get(date); if (observed) { lastWeight = observed.weight; lastPbf = observed.pbf ?? lastPbf; }
      const n = nutritionByDate.get(date);
      const a = activityByDate.get(date);
      const profile: BodyProfile = {
        sex: row.sex_for_formula as "male" | "female", ageYears: ageOn(row.birth_date, date), heightCm: Number(row.height_cm), weightKg: lastWeight,
        bodyFatPct: lastPbf, bodyFatConfidence: row.body_fat_confidence as BodyProfile["bodyFatConfidence"], trainingExperience: row.training_experience as BodyProfile["trainingExperience"],
      };
      const activityInput: ActivityDefaults = a ? {
        mode: a.mode as ActivityDefaults["mode"], wearableActiveKcal: a.wearable_active_kcal ? Number(a.wearable_active_kcal) : undefined,
        manualTotalActiveKcal: a.manual_total_active_kcal ? Number(a.manual_total_active_kcal) : undefined,
        baseNonExerciseActiveKcal: a.base_non_exercise_active_kcal ? Number(a.base_non_exercise_active_kcal) : undefined,
        workout: a.workout as ActivityDefaults["workout"],
      } : row.activity_defaults as ActivityDefaults;
      const macro = { calories: n?.complete ? Number(n.calories) : 2200, proteinG: n?.protein_g ? Number(n.protein_g) : undefined, carbsG: n?.carbs_g ? Number(n.carbs_g) : undefined, fatG: n?.fat_g ? Number(n.fat_g) : undefined };
      const predicted = calculateTdee(profile, macro, activityInput).predictedTdeeKcal;
      regressionDays.push({ date, intakeKcal: n?.complete ? Number(n.calories) : undefined, predictedTdeeKcal: predicted, weightKg: observed?.weight });
    }

    const currentPrediction = regressionDays.at(-1)?.predictedTdeeKcal ?? 0;
    const oldFactor = previous?.[0]?.applied_factor ? Number(previous[0].applied_factor) : 1;
    const calibration = calibrateRollingTdee(regressionDays, currentPrediction, oldFactor);
    const { error: insertError } = await supabase.from("calibration_runs").insert({
      user_id: row.user_id, window_start: startIso, window_end: endIso, data_days: calibration.windowDays,
      raw_factor: calibration.rawFactor, applied_factor: calibration.appliedFactor, calibrated_tdee_kcal: calibration.calibratedTdeeKcal,
      regression_r2: calibration.r2, residual_mae_kg: calibration.residualMaeKg, confidence: calibration.confidence,
      confidence_score: calibration.confidenceScore, warnings: calibration.warnings, engine_version: MODEL_CONFIG.engineVersion,
    });
    results.push({ userId: row.user_id, status: insertError ? insertError.message : calibration.confidence, factor: calibration.appliedFactor });
  }
  return NextResponse.json({ processed: results.length, results });
}
