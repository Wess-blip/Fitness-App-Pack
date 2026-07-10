"use client";

import { useMemo, useState } from "react";
import { CalendarClock, Flame, Gauge, Scale, Target } from "lucide-react";
import { useAppData } from "@/components/app-data-provider";
import { ExpandablePanel } from "@/components/expandable-panel";
import { MetricCard } from "@/components/metric-card";
import { ModelChart } from "@/components/model-chart";
import { normalizeWeights, resolveAppModel, sevenDayAverages, toActivityDefaults, toBodyProfile, toGoalSettings } from "@/lib/app-state/resolve";
import { projectBodyComposition } from "@/lib/engine";
import type { ProjectionScenario } from "@/types/fitness";

const scenarioLabel: Record<ProjectionScenario, string> = { conservative: "Conservative", expected: "Expected", optimistic: "Optimistic" };

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
  const goal = useMemo(() => state.model.calorieTargetMode === "manual"
    ? { ...baseGoal, caloriePlanMode: "fixed" as const, fixedCalories: resolved.effectiveCalorieTargetKcal }
    : baseGoal, [baseGoal, resolved.effectiveCalorieTargetKcal, state.model.calorieTargetMode]);
  const rawBeforeCalibration = resolved.calculatedTdeeKcal / Math.max(state.model.calibrationFactor, 0.01);
  const projectionFactor = resolved.effectiveTdeeKcal / Math.max(rawBeforeCalibration, 1);
  const calculationOptions = useMemo(() => ({ bmrWeights: normalizeWeights(state.model.bmrWeights), tefFallbackRate: state.model.tefFallbackRate }), [state.model.bmrWeights, state.model.tefFallbackRate]);
  const projections = useMemo(() => {
    const make = (item: ProjectionScenario) => projectBodyComposition({
      startDate: state.baseline.startDate,
      profile,
      goal,
      activity,
      calibrationFactor: projectionFactor,
      weeks: state.model.projectionWeeks,
      scenario: item,
      calculationOptions,
    });
    return { conservative: make("conservative"), expected: make("expected"), optimistic: make("optimistic") };
  }, [activity, calculationOptions, goal, profile, projectionFactor, state.baseline.startDate, state.model.projectionWeeks]);
  const selected = projections[scenario];
  const last = selected.points.at(-1)!;
  const targetPoint = selected.points.find((point) => point.status !== "active") ?? last;
  const comparison = projections.expected.points.map((point, index) => ({
    week: point.week,
    expected: point.weightKg,
    conservative: projections.conservative.points[index]?.weightKg ?? projections.conservative.points.at(-1)!.weightKg,
    optimistic: projections.optimistic.points[index]?.weightKg ?? projections.optimistic.points.at(-1)!.weightKg,
  }));
  const detailData = selected.points.map((point) => ({
    week: point.week,
    weight: point.weightKg,
    pbf: point.bodyFatPct * 100,
    lbm: point.leanMassKg,
    fat: point.fatMassKg,
    tdee: point.tdeeKcal,
    intake: point.calorieTarget,
    deficit: point.tdeeKcal - point.calorieTarget,
  }));

  return (
    <>
      <header className="page-header colourful-header projection-hero">
        <div><div className="eyebrow">Planning and forecasting</div><h1>Projection</h1><p style={{ margin: 0 }}>A Dashboard Pro-style view of weight, body composition, energy needs and the path to your target.</p></div>
        <span className="pill strong">{scenarioLabel[scenario]}</span>
      </header>

      <section className="metric-grid projection-metrics">
        <MetricCard label="Current weight" value={`${profile.weightKg.toFixed(1)} kg`} detail={`Target ${state.goals.targetWeightKg ?? "—"} kg`} icon={<Scale size={16} />} tone="blue" />
        <MetricCard label="Current PBF" value={`${(resolved.bodyFatPct * 100).toFixed(1)}%`} detail={`Target ${state.goals.targetBodyFatPct ?? "—"}%`} icon={<Target size={16} />} tone="violet" />
        <MetricCard label="Current LBM" value={`${resolved.leanMassKg.toFixed(1)} kg`} detail={`${resolved.fatMassKg.toFixed(1)} kg fat mass`} icon={<Gauge size={16} />} tone="teal" />
        <MetricCard label="Effective TDEE" value={`${Math.round(resolved.effectiveTdeeKcal)} kcal`} detail={`${resolved.tdeeSource} · factor ${projectionFactor.toFixed(3)}`} icon={<Flame size={16} />} tone="orange" />
      </section>

      <section className="section dashboard-strip">
        <div><span>Planned intake</span><strong>{Math.round(resolved.effectiveCalorieTargetKcal)} kcal</strong></div>
        <div><span>Deficit / surplus</span><strong>{Math.round(resolved.effectiveTdeeKcal - resolved.effectiveCalorieTargetKcal)} kcal/day</strong></div>
        <div><span>Gym burn</span><strong>{Math.round(resolved.gymBurnKcal)} kcal/session</strong></div>
        <div><span>7D calories</span><strong>{averages.calories ? Math.round(averages.calories) : "—"}</strong></div>
        <div><span>7D protein</span><strong>{averages.protein ? `${Math.round(averages.protein)} g` : "—"}</strong></div>
        <div><span>Target date</span><strong>{new Date(`${targetPoint.date}T00:00:00`).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</strong></div>
      </section>

      <section className="section card control-card">
        <div className="row"><div><div className="eyebrow">Scenario</div><h2 style={{ marginTop: 4 }}>Lean-mass response</h2></div><CalendarClock size={22} /></div>
        <div className="segment three">
          {(["conservative", "expected", "optimistic"] as ProjectionScenario[]).map((item) => <button key={item} className={scenario === item ? "active" : ""} onClick={() => setScenario(item)}>{scenarioLabel[item]}</button>)}
        </div>
        <p className="small">The energy model is the same. The scenarios vary only the uncertain lean-mass response to training, protein and calorie balance.</p>
      </section>

      <div className="section">
        <ExpandablePanel title="Projected weight range" subtitle="Tap the expand icon for a larger chart">
          <ModelChart data={comparison} series={[
            { key: "conservative", label: "Conservative", unit: "kg", color: "#64748b", dash: "5 5" },
            { key: "expected", label: "Expected", unit: "kg", color: "#0f766e" },
            { key: "optimistic", label: "Optimistic", unit: "kg", color: "#7c3aed", dash: "4 4" },
          ]} />
        </ExpandablePanel>
      </div>

      <div className="section">
        <ExpandablePanel title={metric === "body" ? "Body-composition path" : "Energy plan"} subtitle={`${scenarioLabel[scenario]} scenario · ${selected.points.length - 1} projected weeks`}>
          <div className="mini-segment chart-toggle"><button className={metric === "body" ? "active" : ""} onClick={() => setMetric("body")}>Body</button><button className={metric === "energy" ? "active" : ""} onClick={() => setMetric("energy")}>Energy</button></div>
          {metric === "body" ? <ModelChart data={detailData} series={[
            { key: "weight", label: "Weight", unit: "kg", color: "#0f766e" },
            { key: "lbm", label: "Lean mass", unit: "kg", color: "#2563eb" },
            { key: "fat", label: "Fat mass", unit: "kg", color: "#ea580c" },
          ]} /> : <ModelChart data={detailData} series={[
            { key: "tdee", label: "TDEE", unit: "kcal", color: "#7c3aed" },
            { key: "intake", label: "Planned intake", unit: "kcal", color: "#0f766e" },
            { key: "deficit", label: "Deficit", unit: "kcal", color: "#ea580c", dash: "5 5" },
          ]} />}
        </ExpandablePanel>
      </div>

      <section className="section outcome-grid">
        <article className="card outcome-card"><span>End weight</span><strong>{last.weightKg.toFixed(1)} kg</strong><small>{(profile.weightKg - last.weightKg).toFixed(1)} kg change</small></article>
        <article className="card outcome-card"><span>End PBF</span><strong>{(last.bodyFatPct * 100).toFixed(1)}%</strong><small>{last.status.replaceAll("-", " ")}</small></article>
        <article className="card outcome-card"><span>End LBM</span><strong>{last.leanMassKg.toFixed(1)} kg</strong><small>{(last.leanMassKg - resolved.leanMassKg >= 0 ? "+" : "") + (last.leanMassKg - resolved.leanMassKg).toFixed(1)} kg</small></article>
        <article className="card outcome-card"><span>End TDEE</span><strong>{Math.round(last.tdeeKcal)} kcal</strong><small>Recalculated with weight</small></article>
      </section>

      <section className="section card">
        <div className="row"><div><div className="eyebrow">Audit view</div><h2 style={{ marginTop: 4 }}>Weekly projection table</h2></div><button className="button secondary" onClick={() => setShowTable(!showTable)}>{showTable ? "Collapse" : "Expand"}</button></div>
        {showTable && <div className="table-scroll"><table className="data-table"><thead><tr><th>Week</th><th>Date</th><th>Weight</th><th>PBF</th><th>LBM</th><th>Fat</th><th>TDEE</th><th>Intake</th><th>Δ / day</th><th>Status</th></tr></thead><tbody>{selected.points.map((point) => <tr key={point.week}><td>{point.week}</td><td>{point.date}</td><td>{point.weightKg.toFixed(2)}</td><td>{(point.bodyFatPct * 100).toFixed(1)}%</td><td>{point.leanMassKg.toFixed(2)}</td><td>{point.fatMassKg.toFixed(2)}</td><td>{Math.round(point.tdeeKcal)}</td><td>{Math.round(point.calorieTarget)}</td><td>{Math.round(point.calorieTarget - point.tdeeKcal)}</td><td>{point.status}</td></tr>)}</tbody></table></div>}
      </section>

      <section className="section notice">Inputs come from your Profile, Goals, Activity and Model setup. Change a source value once and every card, graph and table regenerates. Manual TDEE or calorie overrides remain clearly marked.</section>
    </>
  );
}
