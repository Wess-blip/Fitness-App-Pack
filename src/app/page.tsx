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
import { kgToDisplay, weightUnit } from "@/lib/units";

export default function HomePage() {
  const { state, user } = useAppData();
  const resolved = useMemo(() => resolveAppModel(state), [state]);
  const averages = useMemo(() => sevenDayAverages(state), [state]);
  const projection = useMemo(() => {
    const profile = toBodyProfile(state);
    const baseGoal = toGoalSettings(state);
    const goal = state.model.calorieTargetMode === "manual" ? { ...baseGoal, caloriePlanMode: "fixed" as const, fixedCalories: resolved.effectiveCalorieTargetKcal } : baseGoal;
    return projectBodyComposition({ startDate: state.baseline.startDate, profile, goal, activity: toActivityDefaults(state), calibrationFactor: resolved.effectiveTdeeKcal / Math.max(resolved.predictedTdeeKcal, 1), weeks: Math.min(24, state.model.projectionWeeks), scenario: state.model.projectionScenario, calculationOptions: { bmrWeights: normalizeWeights(state.model.bmrWeights), tefFallbackRate: state.model.tefFallbackRate } });
  }, [resolved, state]);
  const wUnit = weightUnit(state.profile.unitSystem);
  const showWeight = (kg: number) => kgToDisplay(kg, state.profile.unitSystem);
  const data = projection.points.map((point) => ({ date: point.date, weight: showWeight(point.weightKg), pbf: point.bodyFatPct * 100 }));
  const last = projection.points.at(-1)!;
  const target = projection.points.find((point) => point.status !== "active");
  const targetDate = target ? new Date(`${target.date}T00:00:00Z`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "Beyond current horizon";
  const firstName = state.profile.displayName.split(" ")[0] || user?.user_metadata?.full_name?.split(" ")[0] || "there";
  const balance = resolved.effectiveCalorieTargetKcal - resolved.effectiveTdeeKcal;

  return <>
    <section className="home-hero"><div><div className="eyebrow light">Your planning dashboard</div><h1>Hey {firstName}</h1><p>Your plan, targets and projections update together. Logs improve confidence over time.</p></div><Link className="hero-action" href="/setup"><Settings2 size={18} />Edit setup</Link></section>

    <section className="metric-grid floating-metrics">
      <MetricCard label="Weight" value={`${showWeight(state.baseline.currentWeightKg).toFixed(1)} ${wUnit}`} detail={`${(resolved.bodyFatPct * 100).toFixed(1)}% estimated body fat`} icon={<Scale size={16} />} tone="blue" />
      <MetricCard label="TDEE" value={`${Math.round(resolved.effectiveTdeeKcal)} kcal`} detail={`${resolved.calibration.status} · ${resolved.calibration.confidence} confidence`} icon={<Activity size={16} />} tone="violet" />
      <MetricCard label="Calories" value={`${Math.round(resolved.effectiveCalorieTargetKcal)} kcal`} detail={`${balance >= 0 ? "+" : ""}${Math.round(balance)} kcal planned balance`} icon={<Flame size={16} />} tone="orange" />
      <MetricCard label="Protein" value={`${state.goals.plannedProteinG ?? "—"} g`} detail={averages.protein ? `7-day actual ${Math.round(averages.protein)} g` : "Optional target"} icon={<Beef size={16} />} tone="teal" />
    </section>

    <section className="section quick-grid">
      <Link className="quick-card goal" href="/projection"><Target size={22} /><div><span>Goal path</span><strong>{showWeight(resolved.targetWeightKg).toFixed(1)} {wUnit} · {(resolved.targetBodyFatPct * 100).toFixed(1)}%</strong><small>{targetDate}</small></div><ChevronRight size={18} /></Link>
      <Link className="quick-card plan" href="/plan"><Activity size={22} /><div><span>Training plan</span><strong>Push · Pull · Legs</strong><small>{state.goals.sessionsPerWeek} sessions per week</small></div><ChevronRight size={18} /></Link>
    </section>

    <div className="section"><ExpandablePanel title="Expected trajectory" subtitle="Dated weight and body-fat projection"><ModelChart data={data} xKey="date" series={[{ key: "weight", label: "Weight", unit: wUnit, color: "#0d5c63" }, { key: "pbf", label: "Body fat", unit: "%", color: "#a84326", dash: "5 5" }]} /><div className="chart-caption"><span>Projected end</span><strong>{showWeight(last.weightKg).toFixed(1)} {wUnit}</strong><span>{(last.bodyFatPct * 100).toFixed(1)}% body fat</span></div></ExpandablePanel></div>

    <section className="section card planning-first"><div><div className="eyebrow">Recommended next action</div><h2>{resolved.calibration.status === "learning" ? "Keep planning; log complete days when convenient" : "Review your calibrated plan"}</h2><p className="small">Static setup creates the plan immediately. Complete nutrition days and morning weights are used only when there is enough data for a guarded rolling regression.</p></div><Link className="button accent" href={resolved.calibration.status === "learning" ? "/log" : "/projection"}>{resolved.calibration.status === "learning" ? "Add a log" : "Review projection"}<ChevronRight size={16} /></Link></section>
  </>;
}
