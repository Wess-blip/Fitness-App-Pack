"use client";

import { useMemo } from "react";
import { useAppData } from "@/components/app-data-provider";
import { ExpandablePanel } from "@/components/expandable-panel";
import { MetricCard } from "@/components/metric-card";
import { ModelChart } from "@/components/model-chart";
import { resolveAppModel, sevenDayAverages } from "@/lib/app-state/resolve";

function movingAverage(values: Array<{ date: string; weight: number }>, window = 3) {
  return values.map((item, index) => {
    const slice = values.slice(Math.max(0, index - window + 1), index + 1);
    return { ...item, trend: slice.reduce((sum, x) => sum + x.weight, 0) / slice.length };
  });
}

export default function ProgressPage() {
  const { state } = useAppData();
  const resolved = useMemo(() => resolveAppModel(state), [state]);
  const averages = useMemo(() => sevenDayAverages(state), [state]);
  const weights = useMemo(() => movingAverage(state.logs.filter((entry) => entry.type === "Weight" && entry.numericValue !== undefined).map((entry) => ({ date: entry.date, weight: entry.numericValue! })).sort((a, b) => a.date.localeCompare(b.date))), [state.logs]);
  const food = useMemo(() => state.logs.filter((entry) => entry.type === "Food" && entry.numericValue !== undefined).map((entry) => ({ date: entry.date, calories: entry.numericValue!, protein: typeof entry.metadata?.proteinG === "number" ? entry.metadata.proteinG : 0 })).sort((a, b) => a.date.localeCompare(b.date)), [state.logs]);
  const first = weights[0]?.weight;
  const latest = weights.at(-1)?.weight;
  return (
    <>
      <header className="page-header colourful-header"><div><div className="eyebrow">Observed data</div><h1>Progress</h1><p style={{ margin: 0 }}>Logs refine the plan. Raw data stays visible beside trends and model confidence.</p></div></header>
      <section className="metric-grid">
        <MetricCard label="Latest weight" value={latest ? `${latest.toFixed(1)} kg` : "—"} detail={first && latest ? `${latest - first >= 0 ? "+" : ""}${(latest - first).toFixed(1)} kg logged change` : "Add a weigh-in"} tone="blue" />
        <MetricCard label="Body fat" value={`${(resolved.bodyFatPct * 100).toFixed(1)}%`} detail={state.baseline.bodyFatMethod} tone="violet" />
        <MetricCard label="7D calories" value={averages.calories ? `${Math.round(averages.calories)}` : "—"} detail={`${averages.days} completed days`} tone="orange" />
        <MetricCard label="7D protein" value={averages.protein ? `${Math.round(averages.protein)} g` : "—"} detail={`Target ${state.goals.plannedProteinG ?? "—"} g`} tone="teal" />
      </section>
      <div className="section"><ExpandablePanel title="Weight and trend" subtitle="Raw weigh-ins plus rolling trend"><ModelChart data={weights} xKey="date" series={[{ key: "weight", label: "Raw weight", unit: "kg", color: "#94a3b8", dash: "4 4" }, { key: "trend", label: "Trend", unit: "kg", color: "#0f766e" }]} /></ExpandablePanel></div>
      <div className="section"><ExpandablePanel title="Nutrition adherence" subtitle="Logged calories and protein"><ModelChart data={food} xKey="date" series={[{ key: "calories", label: "Calories", unit: "kcal", color: "#ea580c" }, { key: "protein", label: "Protein", unit: "g", color: "#2563eb" }]} /></ExpandablePanel></div>
      <section className="section dashboard-strip compact"><div><span>Waist</span><strong>{state.baseline.waistCm?.toFixed(1) ?? "—"} cm</strong></div><div><span>Lean mass</span><strong>{resolved.leanMassKg.toFixed(1)} kg</strong></div><div><span>Fat mass</span><strong>{resolved.fatMassKg.toFixed(1)} kg</strong></div><div><span>Calibration</span><strong>{state.model.calibrationFactor.toFixed(3)}x</strong></div></section>
      <section className="section notice">Rolling calibration becomes meaningful only after enough complete intake days and morning weights. Until then, the app continues using the profile, activity setup and selected assumptions.</section>
    </>
  );
}
