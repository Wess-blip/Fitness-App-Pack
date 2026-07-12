"use client";

import { useMemo } from "react";
import { useAppData } from "@/components/app-data-provider";
import { ExpandablePanel } from "@/components/expandable-panel";
import { MetricCard } from "@/components/metric-card";
import { ModelChart } from "@/components/model-chart";
import { dailyNutritionSummaries, resolveAppModel, sevenDayAverages } from "@/lib/app-state/resolve";
import { cmToDisplay, kgToDisplay, lengthUnit, weightUnit } from "@/lib/units";

function movingAverage(values: Array<{ date: string; weight: number }>, window = 7) {
  return values.map((item, index) => {
    const slice = values.slice(Math.max(0, index - window + 1), index + 1);
    return { ...item, trend: slice.reduce((sum, point) => sum + point.weight, 0) / slice.length };
  });
}

export default function ProgressPage() {
  const { state } = useAppData();
  const resolved = useMemo(() => resolveAppModel(state), [state]);
  const averages = useMemo(() => sevenDayAverages(state), [state]);
  const wUnit = weightUnit(state.profile.unitSystem);
  const lUnit = lengthUnit(state.profile.unitSystem);
  const weights = useMemo(() => movingAverage(state.logs.filter((entry) => entry.type === "Weight" && entry.numericValue !== undefined).map((entry) => ({ date: entry.date, weight: kgToDisplay(entry.numericValue!, state.profile.unitSystem) })).sort((a, b) => a.date.localeCompare(b.date))), [state.logs, state.profile.unitSystem]);
  const nutrition = useMemo(() => dailyNutritionSummaries(state).map((day) => ({ date: day.date, calories: day.calories, protein: day.protein, complete: day.complete ? 1 : 0 })), [state]);
  const measurements = useMemo(() => state.logs.filter((entry) => entry.type === "Measurement" && entry.numericValue !== undefined).map((entry) => ({ date: entry.date, value: cmToDisplay(entry.numericValue!, state.profile.unitSystem), type: String(entry.metadata?.measurement ?? entry.title) })).sort((a, b) => a.date.localeCompare(b.date)), [state.logs, state.profile.unitSystem]);
  const first = weights[0]?.weight;
  const latest = weights.at(-1)?.weight;
  return <>
    <header className="page-header colourful-header progress-hero"><div><div className="eyebrow">Observed progress</div><h1>Progress</h1><p>See raw entries, trends, measurements, adherence and calibration confidence in one place.</p></div></header>
    <section className="metric-grid">
      <MetricCard label="Latest weight" value={latest ? `${latest.toFixed(1)} ${wUnit}` : "—"} detail={first && latest ? `${latest - first >= 0 ? "+" : ""}${(latest - first).toFixed(1)} ${wUnit} logged change` : "Add a morning weight"} tone="blue" />
      <MetricCard label="Body fat" value={`${(resolved.bodyFatPct * 100).toFixed(1)}%`} detail={state.baseline.bodyFatMethod === "navy" ? "Circumference estimate" : state.baseline.bodyFatMethod} tone="violet" />
      <MetricCard label="7-day calories" value={averages.calories ? `${Math.round(averages.calories)}` : "—"} detail={`${averages.completeDays} complete days`} tone="orange" />
      <MetricCard label="TDEE confidence" value={resolved.calibration.confidence} detail={`${resolved.calibration.calendarDays} day window`} tone="teal" />
    </section>
    <div className="section"><ExpandablePanel title="Weight and 7-entry trend" subtitle="Raw weigh-ins stay visible"><ModelChart data={weights} xKey="date" series={[{ key: "weight", label: "Raw weight", unit: wUnit, color: "#94a3b8", dash: "4 4" }, { key: "trend", label: "Trend", unit: wUnit, color: "#0d5c63" }]} /></ExpandablePanel></div>
    <div className="section"><ExpandablePanel title="Nutrition" subtitle="Daily totals; complete days feed calibration"><ModelChart data={nutrition} xKey="date" series={[{ key: "calories", label: "Calories", unit: "kcal", color: "#a84326" }, { key: "protein", label: "Protein", unit: "g", color: "#335c67" }]} /></ExpandablePanel></div>
    <div className="section"><ExpandablePanel title="Measurements" subtitle={`Waist, neck and hip history in ${lUnit}`}>{measurements.length ? <ModelChart data={measurements} xKey="date" series={[{ key: "value", label: "Measurement", unit: lUnit, color: "#1b6b46" }]} /> : <div className="empty-state"><strong>No measurements yet</strong><span>Add one from Log.</span></div>}</ExpandablePanel></div>
    <section className="section dashboard-strip compact"><div><span>Waist</span><strong>{state.baseline.waistCm ? `${cmToDisplay(state.baseline.waistCm, state.profile.unitSystem).toFixed(1)} ${lUnit}` : "—"}</strong></div><div><span>Lean mass</span><strong>{kgToDisplay(resolved.leanMassKg, state.profile.unitSystem).toFixed(1)} {wUnit}</strong></div><div><span>Fat mass</span><strong>{kgToDisplay(resolved.fatMassKg, state.profile.unitSystem).toFixed(1)} {wUnit}</strong></div><div><span>Calibration</span><strong>{resolved.calibration.appliedFactor.toFixed(3)}x</strong></div></section>
    <section className="section calibration-card card"><div className="row"><div><div className="eyebrow">Rolling regression</div><h2>{resolved.calibration.status === "applied" ? "Used in your plan" : resolved.calibration.status === "preview" ? "Preview only" : "Still learning"}</h2></div><span className={`confidence ${resolved.calibration.confidence}`}>{resolved.calibration.confidence}</span></div><p className="small">{resolved.calibration.weightPoints} weigh-ins · {Math.round(resolved.calibration.intakeCoverage * 100)}% complete nutrition coverage · likely maintenance {Math.round(resolved.calibration.likelyLowKcal)}–{Math.round(resolved.calibration.likelyHighKcal)} kcal</p></section>
  </>;
}
