"use client";

import Link from "next/link";
import { Activity, Beef, ChevronRight, Flame, Scale, Settings2, Target } from "lucide-react";
import { useMemo } from "react";
import { useAppData } from "@/components/app-data-provider";
import { ExpandablePanel } from "@/components/expandable-panel";
import { MetricCard } from "@/components/metric-card";
import { ModelChart } from "@/components/model-chart";
import { normalizeWeights, resolveAppModel, sevenDayAverages, toActivityDefaults, toBodyProfile, toGoalSettings } from "@/lib/app-state/resolve";
import { projectBodyComposition } from "@/lib/engine";

export default function HomePage() {
  const { state, user } = useAppData();
  const resolved = useMemo(() => resolveAppModel(state), [state]);
  const averages = useMemo(() => sevenDayAverages(state), [state]);
  const projection = useMemo(() => {
    const profile = toBodyProfile(state);
    const baseGoal = toGoalSettings(state);
    const goal = state.model.calorieTargetMode === "manual" ? { ...baseGoal, caloriePlanMode: "fixed" as const, fixedCalories: resolved.effectiveCalorieTargetKcal } : baseGoal;
    const raw = resolved.calculatedTdeeKcal / Math.max(state.model.calibrationFactor, 0.01);
    return projectBodyComposition({ startDate: state.baseline.startDate, profile, goal, activity: toActivityDefaults(state), calibrationFactor: resolved.effectiveTdeeKcal / Math.max(raw, 1), weeks: Math.min(24, state.model.projectionWeeks), scenario: state.model.projectionScenario, calculationOptions: { bmrWeights: normalizeWeights(state.model.bmrWeights), tefFallbackRate: state.model.tefFallbackRate } });
  }, [resolved, state]);
  const data = projection.points.map((point) => ({ week: point.week, weight: point.weightKg, pbf: point.bodyFatPct * 100 }));
  const last = projection.points.at(-1)!;
  const firstName = state.profile.displayName.split(" ")[0] || user?.user_metadata?.full_name?.split(" ")[0] || "there";
  return (
    <>
      <section className="home-hero">
        <div><div className="eyebrow light">Fitness planning engine</div><h1>Hey {firstName}</h1><p>Your model is linked. Update one input and the plan, projections and dashboard move together.</p></div>
        <Link className="hero-action" href="/setup"><Settings2 size={18} /> Edit inputs</Link>
      </section>

      <section className="metric-grid floating-metrics">
        <MetricCard label="Weight" value={`${state.baseline.currentWeightKg.toFixed(1)} kg`} detail={`${(resolved.bodyFatPct * 100).toFixed(1)}% estimated PBF`} icon={<Scale size={16} />} tone="blue" />
        <MetricCard label="TDEE" value={`${Math.round(resolved.effectiveTdeeKcal)} kcal`} detail={`${resolved.tdeeSource} value`} icon={<Activity size={16} />} tone="violet" />
        <MetricCard label="Calories" value={`${Math.round(resolved.effectiveCalorieTargetKcal)} kcal`} detail={`${Math.round(resolved.effectiveTdeeKcal - resolved.effectiveCalorieTargetKcal)} kcal planned deficit`} icon={<Flame size={16} />} tone="orange" />
        <MetricCard label="Protein" value={`${state.goals.plannedProteinG ?? "—"} g`} detail={averages.protein ? `7D actual ${Math.round(averages.protein)} g` : "No 7D average yet"} icon={<Beef size={16} />} tone="teal" />
      </section>

      <section className="section quick-grid">
        <Link className="quick-card goal" href="/projection"><Target size={22} /><div><span>Goal path</span><strong>{last.weightKg.toFixed(1)} kg · {(last.bodyFatPct * 100).toFixed(1)}%</strong><small>Open the full projection</small></div><ChevronRight size={18} /></Link>
        <Link className="quick-card plan" href="/plan"><Activity size={22} /><div><span>Next plan</span><strong>Push · Pull · Legs</strong><small>{state.goals.sessionsPerWeek} sessions per week</small></div><ChevronRight size={18} /></Link>
      </section>

      <div className="section">
        <ExpandablePanel title="Expected trajectory" subtitle="Weight and body-fat projection · expandable">
          <ModelChart data={data} series={[{ key: "weight", label: "Weight", unit: "kg", color: "#0f766e" }, { key: "pbf", label: "Body fat", unit: "%", color: "#7c3aed", dash: "5 5" }]} />
          <div className="chart-caption"><span>Projected end</span><strong>{last.weightKg.toFixed(1)} kg</strong><span>{(last.bodyFatPct * 100).toFixed(1)}% PBF</span></div>
        </ExpandablePanel>
      </div>

      <section className="section card planning-first">
        <div><div className="eyebrow">Planning first, logging second</div><h2>Logs improve the model, but do not control everything</h2><p className="small">Your static profile, goals and modular activity setup create a complete plan immediately. Weight, nutrition and activity logs then refine the rolling TDEE calibration and progress view.</p></div>
        <Link className="button accent" href="/setup">Review setup <ChevronRight size={16} /></Link>
      </section>
    </>
  );
}
