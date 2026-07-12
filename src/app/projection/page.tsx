"use client";

import { useMemo, useState } from "react";
import { CalendarClock, Flame, Gauge, Scale, Target } from "lucide-react";
import { useAppData } from "@/components/app-data-provider";
import { ExpandablePanel } from "@/components/expandable-panel";
import { MetricCard } from "@/components/metric-card";
import { ModelChart } from "@/components/model-chart";
import { normalizeWeights, resolveAppModel, sevenDayAverages, toActivityDefaults, toBodyProfile, toGoalSettings } from "@/lib/app-state/resolve";
import { projectBodyComposition } from "@/lib/engine";
import { kgToDisplay, weightUnit } from "@/lib/units";
import type { ProjectionScenario } from "@/types/fitness";

const labels: Record<ProjectionScenario, string> = { conservative: "Conservative", expected: "Expected", optimistic: "Optimistic" };
const fullDate = (date?: string | null) => date ? new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : "Beyond selected horizon";

export default function ProjectionPage() {
  const { state } = useAppData();
  const [scenario, setScenario] = useState<ProjectionScenario>(state.model.projectionScenario);
  const [metric, setMetric] = useState<"body" | "energy">("body");
  const [showTable, setShowTable] = useState(false);
  const resolved = useMemo(() => resolveAppModel(state), [state]);
  const averages = useMemo(() => sevenDayAverages(state), [state]);
  const profile = useMemo(() => toBodyProfile(state), [state]);
  const activity = useMemo(() => toActivityDefaults(state), [state]);
  const baseGoal = useMemo(() => toGoalSettings(state), [state]);
  const goal = useMemo(() => state.model.calorieTargetMode === "manual" ? { ...baseGoal, caloriePlanMode: "fixed" as const, fixedCalories: resolved.effectiveCalorieTargetKcal } : baseGoal, [baseGoal, resolved.effectiveCalorieTargetKcal, state.model.calorieTargetMode]);
  const projectionFactor = resolved.effectiveTdeeKcal / Math.max(resolved.predictedTdeeKcal, 1);
  const options = useMemo(() => ({ bmrWeights: normalizeWeights(state.model.bmrWeights), tefFallbackRate: state.model.tefFallbackRate }), [state.model.bmrWeights, state.model.tefFallbackRate]);
  const projections = useMemo(() => {
    const make = (item: ProjectionScenario) => projectBodyComposition({ startDate: state.baseline.startDate, profile, goal, activity, calibrationFactor: projectionFactor, weeks: state.model.projectionWeeks, scenario: item, calculationOptions: options });
    return { conservative: make("conservative"), expected: make("expected"), optimistic: make("optimistic") };
  }, [activity, goal, options, profile, projectionFactor, state.baseline.startDate, state.model.projectionWeeks]);
  const selected = projections[scenario];
  const last = selected.points.at(-1)!;
  const reached = selected.points.find((point) => point.status !== "active");
  const targetDates = Object.values(projections).map((result) => result.points.find((point) => point.status !== "active")?.date).filter((date): date is string => Boolean(date)).sort();
  const units = state.profile.unitSystem;
  const wUnit = weightUnit(units);
  const displayWeight = (kg: number) => kgToDisplay(kg, units);
  const chart = selected.points.map((point) => ({ date: point.date, weight: displayWeight(point.weightKg), pbf: point.bodyFatPct * 100, lbm: displayWeight(point.leanMassKg), fat: displayWeight(point.fatMassKg), tdee: point.tdeeKcal, intake: point.calorieTarget, balance: point.calorieTarget - point.tdeeKcal }));
  const comparison = projections.expected.points.map((point, index) => ({ date: point.date, expected: displayWeight(point.weightKg), conservative: displayWeight(projections.conservative.points[index]?.weightKg ?? projections.conservative.points.at(-1)!.weightKg), optimistic: displayWeight(projections.optimistic.points[index]?.weightKg ?? projections.optimistic.points.at(-1)!.weightKg) }));

  return <>
    <header className="page-header colourful-header projection-hero"><div><div className="eyebrow">Planning centre</div><h1>Your projection</h1><p>Exact dates, body composition, energy needs and three uncertainty scenarios.</p></div><span className="pill strong">{labels[scenario]}</span></header>

    <section className="target-date-card section">
      <div><div className="eyebrow">Expected target date</div><strong>{fullDate(projections.expected.points.find((point) => point.status !== "active")?.date)}</strong><p>{targetDates.length > 1 ? `Likely range: ${fullDate(targetDates[0])} to ${fullDate(targetDates.at(-1))}` : "Add or adjust the projection horizon to see a likely range."}</p></div>
      <CalendarClock size={32} />
    </section>

    <section className="metric-grid projection-metrics">
      <MetricCard label="Current weight" value={`${displayWeight(profile.weightKg).toFixed(1)} ${wUnit}`} detail={`Target ${displayWeight(resolved.targetWeightKg).toFixed(1)} ${wUnit} (${resolved.goalDriver === "weight" ? "chosen" : "auto"})`} icon={<Scale size={16} />} tone="blue" />
      <MetricCard label="Current body fat" value={`${(resolved.bodyFatPct * 100).toFixed(1)}%`} detail={`Target ${(resolved.targetBodyFatPct * 100).toFixed(1)}% (${resolved.goalDriver === "body-fat" ? "chosen" : "auto"})`} icon={<Target size={16} />} tone="violet" />
      <MetricCard label="Lean mass" value={`${displayWeight(resolved.leanMassKg).toFixed(1)} ${wUnit}`} detail={`${displayWeight(resolved.fatMassKg).toFixed(1)} ${wUnit} fat mass`} icon={<Gauge size={16} />} tone="teal" />
      <MetricCard label="TDEE" value={`${Math.round(resolved.effectiveTdeeKcal)} kcal`} detail={`${resolved.calibration.status} · ${resolved.calibration.confidence} confidence`} icon={<Flame size={16} />} tone="orange" />
    </section>

    <section className="section dashboard-strip">
      <div><span>Planned intake</span><strong>{Math.round(resolved.effectiveCalorieTargetKcal)} kcal</strong></div>
      <div><span>Daily balance</span><strong>{Math.round(resolved.effectiveCalorieTargetKcal - resolved.effectiveTdeeKcal)} kcal</strong></div>
      <div><span>Active energy</span><strong>{Math.round(resolved.activeKcal)} kcal/day</strong></div>
      <div><span>7-day calories</span><strong>{averages.calories ? Math.round(averages.calories) : "—"}</strong></div>
      <div><span>7-day protein</span><strong>{averages.protein ? `${Math.round(averages.protein)} g` : "—"}</strong></div>
      <div><span>Calibration range</span><strong>{Math.round(resolved.calibration.likelyLowKcal)}–{Math.round(resolved.calibration.likelyHighKcal)}</strong></div>
    </section>

    <section className="section card control-card"><div className="row"><div><div className="eyebrow">Scenario</div><h2>Explore uncertainty</h2></div><CalendarClock size={22} /></div><div className="segment three">{(["conservative", "expected", "optimistic"] as ProjectionScenario[]).map((item) => <button key={item} className={scenario === item ? "active" : ""} onClick={() => setScenario(item)}>{labels[item]}</button>)}</div><p className="small">Scenarios vary energy expenditure and the share of change assigned to lean versus fat mass. None is a promise.</p><div className="notice">Lean mass is not the same as muscle. It includes body water, glycogen, organs and other fat-free tissue, so a projected lean-mass decrease must not be read as an equal amount of muscle loss.</div></section>

    <div className="section"><ExpandablePanel title="Projected weight range" subtitle="Tap expand for a full-screen chart"><ModelChart data={comparison} xKey="date" series={[{ key: "conservative", label: "Conservative", unit: wUnit, color: "#64748b", dash: "5 5" }, { key: "expected", label: "Expected", unit: wUnit, color: "#0d5c63" }, { key: "optimistic", label: "Optimistic", unit: wUnit, color: "#a84326", dash: "4 4" }]} /></ExpandablePanel></div>

    <div className="section"><ExpandablePanel title={metric === "body" ? "Body-composition path" : "Energy plan"} subtitle={`${labels[scenario]} · ${fullDate(reached?.date)}`}><div className="mini-segment chart-toggle"><button className={metric === "body" ? "active" : ""} onClick={() => setMetric("body")}>Body</button><button className={metric === "energy" ? "active" : ""} onClick={() => setMetric("energy")}>Energy</button></div>{metric === "body" ? <ModelChart data={chart} xKey="date" series={[{ key: "weight", label: "Weight", unit: wUnit, color: "#0d5c63" }, { key: "lbm", label: "Lean mass", unit: wUnit, color: "#335c67" }, { key: "fat", label: "Fat mass", unit: wUnit, color: "#a84326" }]} /> : <ModelChart data={chart} xKey="date" series={[{ key: "tdee", label: "TDEE", unit: "kcal", color: "#335c67" }, { key: "intake", label: "Intake", unit: "kcal", color: "#0d5c63" }, { key: "balance", label: "Balance", unit: "kcal", color: "#a84326", dash: "5 5" }]} />}</ExpandablePanel></div>

    <section className="section outcome-grid"><article className="card outcome-card"><span>Projected weight</span><strong>{displayWeight(last.weightKg).toFixed(1)} {wUnit}</strong><small>{last.status.replaceAll("-", " ")}</small></article><article className="card outcome-card"><span>Projected body fat</span><strong>{(last.bodyFatPct * 100).toFixed(1)}%</strong><small>{fullDate(last.date)}</small></article><article className="card outcome-card"><span>Projected lean mass</span><strong>{displayWeight(last.leanMassKg).toFixed(1)} {wUnit}</strong><small>{displayWeight(last.leanMassKg - resolved.leanMassKg) >= 0 ? "+" : ""}{displayWeight(last.leanMassKg - resolved.leanMassKg).toFixed(1)} {wUnit}</small></article><article className="card outcome-card"><span>Projected TDEE</span><strong>{Math.round(last.tdeeKcal)} kcal</strong><small>Recalculated each day</small></article></section>

    <section className="section card"><div className="row"><div><div className="eyebrow">Audit view</div><h2>Projection table</h2></div><button className="button secondary" onClick={() => setShowTable(!showTable)}>{showTable ? "Collapse" : "Expand"}</button></div>{showTable && <div className="table-scroll"><table className="data-table"><thead><tr><th>Date</th><th>Weight</th><th>Body fat</th><th>Lean</th><th>Fat</th><th>TDEE</th><th>Intake</th><th>Status</th></tr></thead><tbody>{selected.points.map((point) => <tr key={`${point.day}-${point.date}`}><td>{fullDate(point.date)}</td><td>{displayWeight(point.weightKg).toFixed(2)} {wUnit}</td><td>{(point.bodyFatPct * 100).toFixed(1)}%</td><td>{displayWeight(point.leanMassKg).toFixed(2)}</td><td>{displayWeight(point.fatMassKg).toFixed(2)}</td><td>{Math.round(point.tdeeKcal)}</td><td>{Math.round(point.calorieTarget)}</td><td>{point.status}</td></tr>)}</tbody></table></div>}</section>
  </>;
}
