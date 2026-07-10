"use client";

import { useMemo, useState } from "react";
import { Activity, Calculator, CheckCircle2, Dumbbell, Save, Target, UserRound } from "lucide-react";
import { useAppData } from "@/components/app-data-provider";
import { OverrideField } from "@/components/override-field";
import { resolveAppModel } from "@/lib/app-state/resolve";

const tabs = [
  { id: "profile", label: "Profile", Icon: UserRound },
  { id: "goals", label: "Goals", Icon: Target },
  { id: "activity", label: "Activity", Icon: Activity },
  { id: "model", label: "Model", Icon: Calculator },
] as const;
type Tab = typeof tabs[number]["id"];
const number = (value: string, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

export default function SetupPage() {
  const { state, setState, patch, syncStatus, user } = useAppData();
  const [tab, setTab] = useState<Tab>("profile");
  const resolved = useMemo(() => resolveAppModel(state), [state]);
  const setActivity = (value: Partial<typeof state.activity>) => setState((current) => ({ ...current, activity: { ...current.activity, ...value }, updatedAt: new Date().toISOString() }));
  const setTreadmill = (value: Partial<typeof state.activity.treadmill>) => setState((current) => ({ ...current, activity: { ...current.activity, treadmill: { ...current.activity.treadmill, ...value } }, updatedAt: new Date().toISOString() }));
  const setModel = (value: Partial<typeof state.model>) => setState((current) => ({ ...current, model: { ...current.model, ...value }, updatedAt: new Date().toISOString() }));
  const setBmr = (value: Partial<typeof state.model.bmrWeights>) => setState((current) => ({ ...current, model: { ...current.model, bmrWeights: { ...current.model.bmrWeights, ...value } }, updatedAt: new Date().toISOString() }));

  return (
    <>
      <header className="page-header colourful-header">
        <div><div className="eyebrow">User-specific calculation setup</div><h1>Inputs & goals</h1><p style={{ margin: 0 }}>Static details generate the model. Dynamic data and manual overrides can replace calculated values without breaking the links.</p></div>
        <div className={`save-chip ${syncStatus}`}><Save size={15} /> {syncStatus === "saved" ? "Cloud saved" : syncStatus === "saving" ? "Saving" : syncStatus === "error" ? "Local only" : user ? "Saved" : "Local saved"}</div>
      </header>

      <div className="setup-tabs">
        {tabs.map(({ id, label, Icon }) => <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}><Icon size={17} />{label}</button>)}
      </div>

      {tab === "profile" && <div className="section stack">
        <section className="card tinted-card">
          <div className="section-title"><div><div className="eyebrow">Static data</div><h2>Identity and formula profile</h2></div><span className="pill">Set once</span></div>
          <div className="form-grid two-col">
            <div className="field"><label>Name</label><input value={state.profile.displayName} onChange={(e) => patch("profile", { displayName: e.target.value })} /></div>
            <div className="field"><label>Date of birth</label><input type="date" value={state.profile.birthDate} onChange={(e) => patch("profile", { birthDate: e.target.value })} /></div>
            <div className="field"><label>Sex used by formulas</label><select value={state.profile.sex} onChange={(e) => patch("profile", { sex: e.target.value as "male" | "female" })}><option value="male">Male</option><option value="female">Female</option></select></div>
            <div className="field"><label>Height</label><div className="input-with-unit"><input type="number" step="0.1" value={state.profile.heightCm} onChange={(e) => patch("profile", { heightCm: number(e.target.value) })} /><span>cm</span></div></div>
            <div className="field"><label>Training experience</label><select value={state.profile.trainingExperience} onChange={(e) => patch("profile", { trainingExperience: e.target.value as typeof state.profile.trainingExperience })}><option value="novice">Novice</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></div>
            <div className="field"><label>Time zone</label><input value={state.profile.timezone} onChange={(e) => patch("profile", { timezone: e.target.value })} /></div>
          </div>
        </section>

        <section className="card">
          <div className="section-title"><div><div className="eyebrow">Dynamic baseline</div><h2>Current body data</h2></div><span className="pill">Update anytime</span></div>
          <div className="form-grid two-col">
            <div className="field"><label>Projection start date</label><input type="date" value={state.baseline.startDate} onChange={(e) => patch("baseline", { startDate: e.target.value })} /></div>
            <div className="field"><label>Current weight</label><div className="input-with-unit"><input type="number" step="0.05" value={state.baseline.currentWeightKg} onChange={(e) => patch("baseline", { currentWeightKg: number(e.target.value) })} /><span>kg</span></div></div>
            <div className="field"><label>Body-fat method</label><select value={state.baseline.bodyFatMethod} onChange={(e) => patch("baseline", { bodyFatMethod: e.target.value as typeof state.baseline.bodyFatMethod })}><option value="navy">Calculate from measurements</option><option value="manual">Use manual percentage</option><option value="assumed">Use starting assumption</option></select></div>
            <div className="field"><label>Estimate confidence</label><select value={state.baseline.bodyFatConfidence} onChange={(e) => patch("baseline", { bodyFatConfidence: e.target.value as typeof state.baseline.bodyFatConfidence })}><option value="none">None</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
            {state.baseline.bodyFatMethod === "manual" && <div className="field"><label>Manual body fat</label><div className="input-with-unit"><input type="number" step="0.1" value={state.baseline.manualBodyFatPct ?? ""} onChange={(e) => patch("baseline", { manualBodyFatPct: number(e.target.value) })} /><span>%</span></div></div>}
            {state.baseline.bodyFatMethod === "assumed" && <div className="field"><label>Assumed body fat</label><div className="input-with-unit"><input type="number" step="0.1" value={state.baseline.assumedBodyFatPct} onChange={(e) => patch("baseline", { assumedBodyFatPct: number(e.target.value) })} /><span>%</span></div></div>}
            <div className="field"><label>Waist / belly circumference</label><div className="input-with-unit"><input type="number" step="0.1" value={state.baseline.waistCm ?? ""} onChange={(e) => patch("baseline", { waistCm: number(e.target.value) })} /><span>cm</span></div></div>
            <div className="field"><label>Neck circumference</label><div className="input-with-unit"><input type="number" step="0.1" value={state.baseline.neckCm ?? ""} onChange={(e) => patch("baseline", { neckCm: number(e.target.value) })} /><span>cm</span></div></div>
            {state.profile.sex === "female" && <div className="field"><label>Hip circumference</label><div className="input-with-unit"><input type="number" step="0.1" value={state.baseline.hipCm ?? ""} onChange={(e) => patch("baseline", { hipCm: number(e.target.value) })} /><span>cm</span></div></div>}
          </div>
          <div className="derived-strip"><div><span>Resolved PBF</span><strong>{(resolved.bodyFatPct * 100).toFixed(1)}%</strong></div><div><span>Lean mass</span><strong>{resolved.leanMassKg.toFixed(1)} kg</strong></div><div><span>Fat mass</span><strong>{resolved.fatMassKg.toFixed(1)} kg</strong></div></div>
        </section>
      </div>}

      {tab === "goals" && <div className="section stack">
        <section className="card tinted-card">
          <div className="section-title"><div><div className="eyebrow">Goal engine</div><h2>Outcome and pace</h2></div><Target size={22} /></div>
          <div className="form-grid two-col">
            <div className="field"><label>Goal type</label><select value={state.goals.mode} onChange={(e) => patch("goals", { mode: e.target.value as typeof state.goals.mode })}><option value="lose">Fat loss</option><option value="maintain">Maintenance</option><option value="gain">Muscle gain</option><option value="recomp">Recomposition</option></select></div>
            <div className="field"><label>Weekly rate</label><div className="input-with-unit"><input type="number" min="0" max="2" step="0.05" value={state.goals.targetWeeklyRatePct} onChange={(e) => patch("goals", { targetWeeklyRatePct: number(e.target.value) })} /><span>% BW</span></div></div>
            <div className="field"><label>Target weight</label><div className="input-with-unit"><input type="number" step="0.1" value={state.goals.targetWeightKg ?? ""} onChange={(e) => patch("goals", { targetWeightKg: number(e.target.value) })} /><span>kg</span></div></div>
            <div className="field"><label>Target body fat</label><div className="input-with-unit"><input type="number" step="0.1" value={state.goals.targetBodyFatPct ?? ""} onChange={(e) => patch("goals", { targetBodyFatPct: number(e.target.value) })} /><span>%</span></div></div>
            <div className="field"><label>Calorie planning</label><select value={state.goals.caloriePlanMode} onChange={(e) => patch("goals", { caloriePlanMode: e.target.value as typeof state.goals.caloriePlanMode })}><option value="goal-driven">Generate from TDEE and pace</option><option value="fixed">Use planned daily calories</option></select></div>
            {state.goals.caloriePlanMode === "fixed" && <div className="field"><label>Planned calories</label><div className="input-with-unit"><input type="number" step="25" value={state.goals.fixedCalories ?? ""} onChange={(e) => patch("goals", { fixedCalories: number(e.target.value) })} /><span>kcal</span></div></div>}
            <div className="field"><label>Planned protein</label><div className="input-with-unit"><input type="number" step="5" value={state.goals.plannedProteinG ?? ""} onChange={(e) => patch("goals", { plannedProteinG: number(e.target.value) })} /><span>g</span></div></div>
            <div className="field"><label>Planned fat</label><div className="input-with-unit"><input type="number" step="5" value={state.goals.plannedFatG ?? ""} onChange={(e) => patch("goals", { plannedFatG: number(e.target.value) })} /><span>g</span></div></div>
            <div className="field"><label>Training sessions per week</label><input type="number" min="0" max="7" value={state.goals.sessionsPerWeek} onChange={(e) => patch("goals", { sessionsPerWeek: number(e.target.value) })} /></div>
            <div className="field"><label>When target is reached</label><select value={state.goals.onTarget} onChange={(e) => patch("goals", { onTarget: e.target.value as typeof state.goals.onTarget })}><option value="stop">Stop projection</option><option value="maintenance">Transition to maintenance</option></select></div>
          </div>
        </section>
        <section className="card">
          <OverrideField label="Daily calorie target" mode={state.model.calorieTargetMode} autoValue={resolved.calculatedCalorieTargetKcal} manualValue={state.model.manualCalorieTargetKcal} unit="kcal" min={1000} max={6000} step={25} onMode={(mode) => setModel({ calorieTargetMode: mode })} onValue={(value) => setModel({ manualCalorieTargetKcal: value })} />
          <div className="notice">Auto mode always regenerates when weight, activity, TDEE or goal pace changes. Manual mode keeps your override while every other projection field remains linked.</div>
        </section>
      </div>}

      {tab === "activity" && <div className="section stack">
        <section className="card tinted-card">
          <div className="section-title"><div><div className="eyebrow">Mutually exclusive modes</div><h2>Choose how activity enters TDEE</h2></div><Activity size={22} /></div>
          <div className="choice-grid">
            {[
              ["wearable-total", "Wearable total", "Use Apple Health/Watch active energy. Workouts are already included."],
              ["manual-total", "Manual daily total", "Enter one total active-calorie number yourself."],
              ["components", "Build from modules", "Base activity + weights + core + optional treadmill + walking."],
            ].map(([id, title, detail]) => <button key={id} className={state.activity.mode === id ? "choice-card active" : "choice-card"} onClick={() => setActivity({ mode: id as typeof state.activity.mode })}><strong>{title}</strong><span>{detail}</span></button>)}
          </div>
        </section>

        {state.activity.mode === "wearable-total" && <section className="card"><div className="field"><label>Default wearable active energy</label><div className="input-with-unit"><input type="number" value={state.activity.wearableActiveKcal ?? ""} onChange={(e) => setActivity({ wearableActiveKcal: number(e.target.value) })} /><span>kcal/day</span></div></div><p className="small">Daily Apple Health imports can replace this default. Gym and treadmill modules are not added again.</p></section>}
        {state.activity.mode === "manual-total" && <section className="card"><div className="field"><label>Default manual active energy</label><div className="input-with-unit"><input type="number" value={state.activity.manualTotalActiveKcal ?? ""} onChange={(e) => setActivity({ manualTotalActiveKcal: number(e.target.value) })} /><span>kcal/day</span></div></div><p className="small">You can override this on individual days from Log → Activity.</p></section>}
        {state.activity.mode === "components" && <>
          <section className="card">
            <div className="section-title"><div><div className="eyebrow">Daily base</div><h2>Non-exercise activity</h2></div><Dumbbell size={22} /></div>
            <div className="form-grid two-col">
              <div className="field"><label>Base active calories</label><div className="input-with-unit"><input type="number" value={state.activity.baseNonExerciseActiveKcal ?? ""} onChange={(e) => setActivity({ baseNonExerciseActiveKcal: number(e.target.value) })} /><span>kcal/day</span></div></div>
              <div className="field"><label>Workout days per week</label><input type="number" min="0" max="7" value={state.activity.workoutDaysPerWeek} onChange={(e) => setActivity({ workoutDaysPerWeek: number(e.target.value) })} /></div>
              <label className="toggle-row"><input type="checkbox" checked={state.activity.averagePlannedWorkoutAcrossWeek} onChange={(e) => setActivity({ averagePlannedWorkoutAcrossWeek: e.target.checked })} /><span><strong>Average workouts across the week</strong><small>Recommended for planning projections.</small></span></label>
            </div>
          </section>
          <section className="card">
            <div className="section-title"><div><div className="eyebrow">Training modules</div><h2>Weights, core and walking</h2></div><span className="pill">{Math.round(resolved.gymBurnKcal)} kcal/session</span></div>
            <div className="form-grid two-col">
              <div className="field"><label>Weights duration</label><div className="input-with-unit"><input type="number" value={state.activity.weightsMinutes} onChange={(e) => setActivity({ weightsMinutes: number(e.target.value) })} /><span>min</span></div></div>
              <div className="field"><label>Weights intensity</label><div className="input-with-unit"><input type="number" step="0.1" value={state.activity.weightsMet} onChange={(e) => setActivity({ weightsMet: number(e.target.value) })} /><span>MET</span></div></div>
              <div className="field"><label>Core duration</label><div className="input-with-unit"><input type="number" value={state.activity.coreMinutes} onChange={(e) => setActivity({ coreMinutes: number(e.target.value) })} /><span>min</span></div></div>
              <div className="field"><label>Core intensity</label><div className="input-with-unit"><input type="number" step="0.1" value={state.activity.coreMet} onChange={(e) => setActivity({ coreMet: number(e.target.value) })} /><span>MET</span></div></div>
              <div className="field"><label>Walk-home active calories</label><div className="input-with-unit"><input type="number" value={state.activity.walkActiveKcal} onChange={(e) => setActivity({ walkActiveKcal: number(e.target.value) })} /><span>kcal</span></div></div>
            </div>
          </section>
          <section className="card treadmill-card">
            <div className="row"><div><div className="eyebrow">Optional</div><h2 style={{ marginTop: 4 }}>Treadmill module</h2></div><label className="switch"><input type="checkbox" checked={state.activity.treadmill.enabled} onChange={(e) => setTreadmill({ enabled: e.target.checked })} /><span /></label></div>
            {state.activity.treadmill.enabled ? <div className="form-grid two-col section">
              <div className="field"><label>Speed</label><div className="input-with-unit"><input type="number" step="0.1" value={state.activity.treadmill.speedKmh} onChange={(e) => setTreadmill({ speedKmh: number(e.target.value) })} /><span>km/h</span></div></div>
              <div className="field"><label>Incline</label><div className="input-with-unit"><input type="number" step="0.5" value={state.activity.treadmill.inclinePct} onChange={(e) => setTreadmill({ inclinePct: number(e.target.value) })} /><span>%</span></div></div>
              <div className="field"><label>Input method</label><select value={state.activity.treadmill.inputMode} onChange={(e) => setTreadmill({ inputMode: e.target.value as "duration" | "target" })}><option value="duration">Duration</option><option value="target">Target active calories</option></select></div>
              {state.activity.treadmill.inputMode === "duration" ? <div className="field"><label>Duration</label><div className="input-with-unit"><input type="number" value={state.activity.treadmill.durationMin ?? ""} onChange={(e) => setTreadmill({ durationMin: number(e.target.value) })} /><span>min</span></div></div> : <div className="field"><label>Target active calories</label><div className="input-with-unit"><input type="number" value={state.activity.treadmill.targetActiveKcal ?? ""} onChange={(e) => setTreadmill({ targetActiveKcal: number(e.target.value) })} /><span>kcal</span></div></div>}
              <div className="field"><label>Ramp-up</label><div className="input-with-unit"><input type="number" value={state.activity.treadmill.rampMin} onChange={(e) => setTreadmill({ rampMin: number(e.target.value) })} /><span>min</span></div></div>
              <div className="field"><label>Cooldown active calories</label><div className="input-with-unit"><input type="number" value={state.activity.treadmill.cooldownActiveKcal} onChange={(e) => setTreadmill({ cooldownActiveKcal: number(e.target.value) })} /><span>kcal</span></div></div>
              <div className="derived-inline"><CheckCircle2 size={18} /><span>Projected treadmill time</span><strong>{resolved.treadmillMinutes.toFixed(0)} min</strong></div>
            </div> : <p className="small">Disabled. The engine records the module as intentionally off, not as missing data.</p>}
          </section>
        </>}
      </div>}

      {tab === "model" && <div className="section stack">
        <section className="card tinted-card">
          <div className="section-title"><div><div className="eyebrow">Advanced but editable</div><h2>Calculation assumptions</h2></div><Calculator size={22} /></div>
          <p className="small">These are the workbook-style backend settings. Changes affect every linked dashboard and projection. The three BMR weights are normalized automatically, so they do not need to add to exactly 100.</p>
          <div className="form-grid three-col">
            <div className="field"><label>Mifflin weight</label><div className="input-with-unit"><input type="number" step="0.05" value={state.model.bmrWeights.mifflin} onChange={(e) => setBmr({ mifflin: number(e.target.value) })} /><span>x</span></div></div>
            <div className="field"><label>Cunningham weight</label><div className="input-with-unit"><input type="number" step="0.05" value={state.model.bmrWeights.cunningham} onChange={(e) => setBmr({ cunningham: number(e.target.value) })} /><span>x</span></div></div>
            <div className="field"><label>Katch weight</label><div className="input-with-unit"><input type="number" step="0.05" value={state.model.bmrWeights.katchMcArdle} onChange={(e) => setBmr({ katchMcArdle: number(e.target.value) })} /><span>x</span></div></div>
            <div className="field"><label>TEF method</label><select value={state.model.tefMode} onChange={(e) => setModel({ tefMode: e.target.value as "macro" | "flat" })}><option value="macro">Macro-specific when available</option><option value="flat">Flat percentage</option></select></div>
            <div className="field"><label>Fallback TEF rate</label><div className="input-with-unit"><input type="number" step="0.01" value={state.model.tefFallbackRate} onChange={(e) => setModel({ tefFallbackRate: number(e.target.value) })} /><span>x</span></div></div>
            <div className="field"><label>Rolling calibration factor</label><div className="input-with-unit"><input type="number" min="0.85" max="1.15" step="0.005" value={state.model.calibrationFactor} onChange={(e) => setModel({ calibrationFactor: number(e.target.value) })} /><span>x</span></div></div>
          </div>
        </section>
        <section className="card stack">
          <OverrideField label="TDEE" mode={state.model.tdeeMode} autoValue={resolved.calculatedTdeeKcal} manualValue={state.model.manualTdeeKcal} unit="kcal/day" min={1200} max={6000} step={25} onMode={(mode) => setModel({ tdeeMode: mode })} onValue={(value) => setModel({ manualTdeeKcal: value })} />
          <div className="notice">Manual TDEE becomes the projection baseline. The model still scales future energy needs as body weight changes.</div>
        </section>
        <section className="card">
          <div className="form-grid two-col">
            <div className="field"><label>Default projection scenario</label><select value={state.model.projectionScenario} onChange={(e) => setModel({ projectionScenario: e.target.value as typeof state.model.projectionScenario })}><option value="conservative">Conservative LBM</option><option value="expected">Expected LBM</option><option value="optimistic">Optimistic LBM</option></select></div>
            <div className="field"><label>Projection horizon</label><div className="input-with-unit"><input type="number" min="4" max="104" value={state.model.projectionWeeks} onChange={(e) => setModel({ projectionWeeks: number(e.target.value) })} /><span>weeks</span></div></div>
          </div>
        </section>
      </div>}
    </>
  );
}
