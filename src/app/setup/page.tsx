"use client";

import { useMemo, useState } from "react";
import { Activity, Calculator, CheckCircle2, Ruler, Save, Target, UserRound } from "lucide-react";
import { useAppData } from "@/components/app-data-provider";
import { OverrideField } from "@/components/override-field";
import { UnitNumberInput } from "@/components/unit-number-input";
import { resolveAppModel } from "@/lib/app-state/resolve";
import { kgToUnit, unitToKg } from "@/lib/units";
import type { AppFieldUnits } from "@/types/app-state";

const tabs = [
  { id: "about", label: "About you", Icon: UserRound },
  { id: "baseline", label: "Current data", Icon: Ruler },
  { id: "goals", label: "Goal", Icon: Target },
  { id: "activity", label: "Activity", Icon: Activity },
  { id: "advanced", label: "Advanced", Icon: Calculator },
] as const;
type Tab = typeof tabs[number]["id"];
const numeric = (value: string, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

export default function SetupPage() {
  const { state, setState, patch, syncStatus, user } = useAppData();
  const [tab, setTab] = useState<Tab>("about");
  const resolved = useMemo(() => resolveAppModel(state), [state]);
  const fieldUnits = state.profile.fieldUnits;
  const wUnit = fieldUnits.bodyWeight;
  const weight = (kg: number) => kgToUnit(kg, wUnit);
  const setFieldUnit = <K extends keyof AppFieldUnits>(field: K, unit: AppFieldUnits[K]) => patch("profile", {
    fieldUnits: { ...fieldUnits, [field]: unit },
    ...(field === "bodyWeight" ? { unitSystem: unit === "lb" ? "imperial" as const : "metric" as const } : {}),
  });
  const setActivity = (value: Partial<typeof state.activity>) => setState((current) => ({ ...current, activity: { ...current.activity, ...value }, updatedAt: new Date().toISOString() }));
  const setTreadmill = (value: Partial<typeof state.activity.treadmill>) => setState((current) => ({ ...current, activity: { ...current.activity, treadmill: { ...current.activity.treadmill, ...value } }, updatedAt: new Date().toISOString() }));
  const setModel = (value: Partial<typeof state.model>) => setState((current) => ({ ...current, model: { ...current.model, ...value }, updatedAt: new Date().toISOString() }));

  return <>
    <header className="page-header colourful-header setup-hero">
      <div><div className="eyebrow">Your calculation setup</div><h1>Build your plan</h1><p>Enter what you know. Auto fields stay linked; switch only the value you want to control to Manual.</p></div>
      <div className={`save-chip ${syncStatus}`}><Save size={15} />{syncStatus === "saving" ? "Saving" : syncStatus === "error" ? "Saved on this device" : user ? "Cloud saved" : "Saved on this device"}</div>
    </header>

    <div className="setup-tabs guided-tabs">{tabs.map(({ id, label, Icon }, index) => <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}><span>{index + 1}</span><Icon size={16} />{label}</button>)}</div>

    {tab === "about" && <div className="section stack">
      <section className="card tinted-card">
        <div className="section-title"><div><div className="eyebrow">Step 1</div><h2>About you</h2></div><span className="pill">Set once</span></div>
        <div className="form-grid two-col">
          <div className="field"><label>Name</label><input value={state.profile.displayName} placeholder="Your name" onChange={(e) => patch("profile", { displayName: e.target.value })} /></div>
          <div className="notice"><strong>Units are chosen per field.</strong><br /><small>Every selector changes display and entry only. Calculations continue using one canonical value.</small></div>
          <div className="field"><label>Date of birth</label><input type="date" value={state.profile.birthDate} onChange={(e) => patch("profile", { birthDate: e.target.value })} /></div>
          <div className="field"><label>Sex used by formulas</label><select value={state.profile.sex} onChange={(e) => patch("profile", { sex: e.target.value as "male" | "female" })}><option value="male">Male</option><option value="female">Female</option></select></div>
          <div className="field"><label>Height</label><UnitNumberInput label="Height" kind="length" value={state.profile.heightCm} unit={fieldUnits.height} onValue={(heightCm) => patch("profile", { heightCm })} onUnit={(unit) => setFieldUnit("height", unit as AppFieldUnits["height"])} /></div>
          <div className="field"><label>Training experience</label><select value={state.profile.trainingExperience} onChange={(e) => patch("profile", { trainingExperience: e.target.value as typeof state.profile.trainingExperience })}><option value="novice">New / returning</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></div>
        </div>
        <button className="button accent step-next" onClick={() => setTab("baseline")}>Next: current data</button>
      </section>
    </div>}

    {tab === "baseline" && <div className="section stack">
      <section className="card tinted-card">
        <div className="section-title"><div><div className="eyebrow">Step 2</div><h2>Current body data</h2></div><span className="pill">Update anytime</span></div>
        <div className="form-grid two-col">
          <div className="field"><label>Projection start date</label><input type="date" value={state.baseline.startDate} onChange={(e) => patch("baseline", { startDate: e.target.value })} /></div>
          <div className="field"><label>Current weight</label><UnitNumberInput label="Current weight" kind="weight" value={state.baseline.currentWeightKg} unit={fieldUnits.bodyWeight} onValue={(currentWeightKg) => patch("baseline", { currentWeightKg })} onUnit={(unit) => setFieldUnit("bodyWeight", unit as AppFieldUnits["bodyWeight"])} /></div>
          <div className="field"><label>How should body fat be set?</label><select value={state.baseline.bodyFatMethod} onChange={(e) => patch("baseline", { bodyFatMethod: e.target.value as typeof state.baseline.bodyFatMethod })}><option value="manual">Measured / manual percentage</option><option value="navy">Calculate from circumferences</option><option value="assumed">Use a planning estimate</option></select></div>
          <div className="field"><label>How reliable is it?</label><select value={state.baseline.bodyFatConfidence} onChange={(e) => patch("baseline", { bodyFatConfidence: e.target.value as typeof state.baseline.bodyFatConfidence })}><option value="none">Unknown</option><option value="low">Rough estimate</option><option value="medium">Consistent home method</option><option value="high">Professional measurement</option></select></div>
          {state.baseline.bodyFatMethod === "manual" && <div className="field"><label>Body fat</label><div className="input-with-unit"><input type="number" min="3" max="65" step="0.1" value={state.baseline.manualBodyFatPct ?? ""} onChange={(e) => patch("baseline", { manualBodyFatPct: numeric(e.target.value) })} /><span>%</span></div></div>}
          {state.baseline.bodyFatMethod === "assumed" && <div className="field"><label>Planning estimate</label><div className="input-with-unit"><input type="number" min="3" max="65" step="0.1" value={state.baseline.assumedBodyFatPct} onChange={(e) => patch("baseline", { assumedBodyFatPct: numeric(e.target.value) })} /><span>%</span></div></div>}
          {state.baseline.bodyFatMethod === "navy" && <>
            <div className="field"><label>Waist / abdomen</label><UnitNumberInput label="Waist or abdomen" kind="length" value={state.baseline.waistCm} unit={fieldUnits.waist} onValue={(waistCm) => patch("baseline", { waistCm })} onUnit={(unit) => setFieldUnit("waist", unit as AppFieldUnits["waist"])} /></div>
            <div className="field"><label>Neck</label><UnitNumberInput label="Neck" kind="length" value={state.baseline.neckCm} unit={fieldUnits.neck} onValue={(neckCm) => patch("baseline", { neckCm })} onUnit={(unit) => setFieldUnit("neck", unit as AppFieldUnits["neck"])} /></div>
            {state.profile.sex === "female" && <div className="field"><label>Hips</label><UnitNumberInput label="Hips" kind="length" value={state.baseline.hipCm} unit={fieldUnits.hips} onValue={(hipCm) => patch("baseline", { hipCm })} onUnit={(unit) => setFieldUnit("hips", unit as AppFieldUnits["hips"])} /></div>}
          </>}
        </div>
        <div className="derived-strip"><div><span>Resolved body fat</span><strong>{(resolved.bodyFatPct * 100).toFixed(1)}%</strong></div><div><span>Lean mass</span><strong>{weight(resolved.leanMassKg).toFixed(1)} {wUnit}</strong></div><div><span>Fat mass</span><strong>{weight(resolved.fatMassKg).toFixed(1)} {wUnit}</strong></div></div>
        <button className="button accent step-next" onClick={() => setTab("goals")}>Next: choose goal</button>
      </section>
    </div>}

    {tab === "goals" && <div className="section stack">
      <section className="card tinted-card">
        <div className="section-title"><div><div className="eyebrow">Step 3</div><h2>Choose the goal that drives the plan</h2></div><Target size={22} /></div>
        <div className="form-grid two-col">
          <div className="field"><label>Goal type</label><select value={state.goals.mode} onChange={(e) => patch("goals", { mode: e.target.value as typeof state.goals.mode })}><option value="lose">Lose fat / weight</option><option value="maintain">Maintain</option><option value="gain">Gain muscle / weight</option><option value="recomp">Recomposition</option></select></div>
          <div className="field"><label>Primary target</label><select value={state.goals.goalDriver} onChange={(e) => patch("goals", { goalDriver: e.target.value as typeof state.goals.goalDriver })}><option value="body-fat">Body-fat percentage</option><option value="weight">Target weight</option></select></div>
          {state.goals.goalDriver === "body-fat" ? <div className="field"><label>Target body fat</label><div className="input-with-unit"><input type="number" min="3" max="65" step="0.1" value={state.goals.targetBodyFatPct ?? ""} onChange={(e) => patch("goals", { targetBodyFatPct: numeric(e.target.value) })} /><span>%</span></div></div> : <div className="field"><label>Target weight</label><UnitNumberInput label="Target weight" kind="weight" value={state.goals.targetWeightKg ?? resolved.targetWeightKg} unit={fieldUnits.targetWeight} onValue={(targetWeightKg) => patch("goals", { targetWeightKg })} onUnit={(unit) => setFieldUnit("targetWeight", unit as AppFieldUnits["targetWeight"])} /></div>}
          <div className="field"><label>Weekly pace</label><div className="input-with-unit"><input type="number" min="0" max="2" step="0.05" value={state.goals.targetWeeklyRatePct} onChange={(e) => patch("goals", { targetWeeklyRatePct: numeric(e.target.value) })} /><span>% body weight</span></div><small>The engine applies safety limits if this is too aggressive.</small></div>
        </div>

        <div className="linked-goal-card">
          <div><span className="auto-chip">AUTO</span><small>Linked target weight</small><strong>{kgToUnit(resolved.targetWeightKg, fieldUnits.targetWeight).toFixed(1)} {fieldUnits.targetWeight}</strong></div>
          <div className="link-symbol">â‡„</div>
          <div><span className="auto-chip">AUTO</span><small>Linked body fat</small><strong>{(resolved.targetBodyFatPct * 100).toFixed(1)}%</strong></div>
        </div>
        <p className="small muted">The inactive target is derived from target lean mass. For example, 50 kg lean mass at 15% body fat equals 58.8 kg target weight; 50 kg lean mass at 60 kg equals 16.7% body fat.</p>

        <OverrideField label="Target lean mass assumption" mode={state.goals.targetLeanMassMode} autoValue={kgToUnit(resolved.leanMassKg, fieldUnits.targetLeanMass)} manualValue={state.goals.manualTargetLeanMassKg === undefined ? undefined : kgToUnit(state.goals.manualTargetLeanMassKg, fieldUnits.targetLeanMass)} unit={fieldUnits.targetLeanMass} unitOptions={[{ value: "kg", label: "kg" }, { value: "lb", label: "lb" }]} onUnit={(unit) => setFieldUnit("targetLeanMass", unit as AppFieldUnits["targetLeanMass"])} min={20} max={500} step={0.1} onMode={(mode) => patch("goals", { targetLeanMassMode: mode })} onValue={(value) => patch("goals", { manualTargetLeanMassKg: unitToKg(value, fieldUnits.targetLeanMass) })} />

        <div className="form-grid two-col section">
          <div className="field"><label>Calories</label><select value={state.goals.caloriePlanMode} onChange={(e) => patch("goals", { caloriePlanMode: e.target.value as typeof state.goals.caloriePlanMode })}><option value="goal-driven">Auto from TDEE and pace</option><option value="fixed">Fixed daily amount</option></select></div>
          {state.goals.caloriePlanMode === "fixed" && <div className="field"><label>Fixed calories</label><div className="input-with-unit"><input type="number" step="25" value={state.goals.fixedCalories ?? ""} onChange={(e) => patch("goals", { fixedCalories: numeric(e.target.value) })} /><span>kcal</span></div></div>}
          <div className="field"><label>Protein (optional)</label><div className="input-with-unit"><input type="number" step="5" value={state.goals.plannedProteinG ?? ""} onChange={(e) => patch("goals", { plannedProteinG: numeric(e.target.value) })} /><span>g</span></div></div>
          <div className="field"><label>Fat (optional)</label><div className="input-with-unit"><input type="number" step="5" value={state.goals.plannedFatG ?? ""} onChange={(e) => patch("goals", { plannedFatG: numeric(e.target.value) })} /><span>g</span></div></div>
          <div className="field"><label>Resistance sessions / week</label><input type="number" min="0" max="7" value={state.goals.sessionsPerWeek} onChange={(e) => patch("goals", { sessionsPerWeek: numeric(e.target.value) })} /></div>
          <div className="field"><label>At the target</label><select value={state.goals.onTarget} onChange={(e) => patch("goals", { onTarget: e.target.value as typeof state.goals.onTarget })}><option value="stop">Stop projection</option><option value="maintenance">Transition to maintenance</option></select></div>
        </div>
        <OverrideField label="Daily calorie target" mode={state.model.calorieTargetMode} autoValue={resolved.calculatedCalorieTargetKcal} manualValue={state.model.manualCalorieTargetKcal} unit="kcal" min={1000} max={6000} step={25} onMode={(mode) => setModel({ calorieTargetMode: mode })} onValue={(value) => setModel({ manualCalorieTargetKcal: value })} />
        <button className="button accent step-next" onClick={() => setTab("activity")}>Next: activity</button>
      </section>
    </div>}

    {tab === "activity" && <div className="section stack">
      <section className="card tinted-card">
        <div className="section-title"><div><div className="eyebrow">Step 4</div><h2>How should activity be counted?</h2></div><Activity size={22} /></div>
        <div className="choice-grid">{[
          ["wearable-total", "Wearable total", "Use one total from Apple Health or another wearable. Workouts are already inside it."],
          ["manual-total", "Manual total", "Enter one daily active-calorie total yourself."],
          ["components", "Build from modules", "Base movement plus planned training and optional treadmill."],
        ].map(([id, title, detail]) => <button key={id} className={state.activity.mode === id ? "choice-card active" : "choice-card"} onClick={() => setActivity({ mode: id as typeof state.activity.mode })}><strong>{title}</strong><span>{detail}</span></button>)}</div>
      </section>
      {state.activity.mode === "wearable-total" && <section className="card"><div className="field"><label>Typical wearable active energy</label><div className="input-with-unit"><input type="number" value={state.activity.wearableActiveKcal ?? ""} onChange={(e) => setActivity({ wearableActiveKcal: numeric(e.target.value) })} /><span>kcal/day</span></div></div><div className="notice">Gym and treadmill calories will not be added again.</div></section>}
      {state.activity.mode === "manual-total" && <section className="card"><div className="field"><label>Typical manual active energy</label><div className="input-with-unit"><input type="number" value={state.activity.manualTotalActiveKcal ?? ""} onChange={(e) => setActivity({ manualTotalActiveKcal: numeric(e.target.value) })} /><span>kcal/day</span></div></div></section>}
      {state.activity.mode === "components" && <>
        <section className="card"><div className="form-grid two-col">
          <div className="field"><label>Base movement</label><div className="input-with-unit"><input type="number" value={state.activity.baseNonExerciseActiveKcal ?? ""} onChange={(e) => setActivity({ baseNonExerciseActiveKcal: numeric(e.target.value) })} /><span>kcal/day</span></div></div>
          <div className="field"><label>Workout days</label><input type="number" min="0" max="7" value={state.activity.workoutDaysPerWeek} onChange={(e) => setActivity({ workoutDaysPerWeek: numeric(e.target.value) })} /></div>
          <div className="field"><label>Weights</label><div className="input-with-unit"><input type="number" value={state.activity.weightsMinutes} onChange={(e) => setActivity({ weightsMinutes: numeric(e.target.value) })} /><span>min/session</span></div></div>
          <div className="field"><label>Weights intensity</label><select value={state.activity.weightsMet} onChange={(e) => setActivity({ weightsMet: numeric(e.target.value) })}><option value="3.5">Light / moderate</option><option value="4">Typical session</option><option value="6">Vigorous</option></select></div>
          <div className="field"><label>Core</label><div className="input-with-unit"><input type="number" value={state.activity.coreMinutes} onChange={(e) => setActivity({ coreMinutes: numeric(e.target.value) })} /><span>min/session</span></div></div>
          <label className="toggle-row"><input type="checkbox" checked={state.activity.averagePlannedWorkoutAcrossWeek} onChange={(e) => setActivity({ averagePlannedWorkoutAcrossWeek: e.target.checked })} /><span><strong>Average workouts across the week</strong><small>Recommended for a smoother planning projection.</small></span></label>
        </div></section>
        <section className="card treadmill-card">
          <div className="row"><div><div className="eyebrow">Optional module</div><h2>Treadmill</h2></div><label className="switch"><input type="checkbox" checked={state.activity.treadmill.enabled} onChange={(e) => setTreadmill({ enabled: e.target.checked })} /><span /></label></div>
          {state.activity.treadmill.enabled ? <div className="form-grid two-col section">
            <div className="field"><label>Speed</label><UnitNumberInput label="Treadmill speed" kind="speed" value={state.activity.treadmill.speedKmh} unit={fieldUnits.treadmillSpeed} onValue={(speedKmh) => setTreadmill({ speedKmh })} onUnit={(unit) => setFieldUnit("treadmillSpeed", unit as AppFieldUnits["treadmillSpeed"])} /></div>
            <div className="field"><label>Incline</label><div className="input-with-unit"><input type="number" step="0.5" value={state.activity.treadmill.inclinePct} onChange={(e) => setTreadmill({ inclinePct: numeric(e.target.value) })} /><span>%</span></div></div>
            <div className="field"><label>Plan by</label><select value={state.activity.treadmill.inputMode} onChange={(e) => setTreadmill({ inputMode: e.target.value as "duration" | "target" })}><option value="duration">Duration</option><option value="target">Active calories</option></select></div>
            {state.activity.treadmill.inputMode === "duration" ? <div className="field"><label>Duration</label><div className="input-with-unit"><input type="number" value={state.activity.treadmill.durationMin ?? ""} onChange={(e) => setTreadmill({ durationMin: numeric(e.target.value) })} /><span>min</span></div></div> : <div className="field"><label>Active-calorie target</label><div className="input-with-unit"><input type="number" value={state.activity.treadmill.targetActiveKcal ?? ""} onChange={(e) => setTreadmill({ targetActiveKcal: numeric(e.target.value) })} /><span>kcal</span></div></div>}
            <div className="derived-inline"><CheckCircle2 size={18} /><span>Calculated time</span><strong>{resolved.treadmillMinutes === null ? "Off" : `${resolved.treadmillMinutes.toFixed(0)} min`}</strong></div>
          </div> : <p className="small">Off. This is recorded as intentionally disabled, not missing.</p>}
        </section>
      </>}
    </div>}

    {tab === "advanced" && <div className="section stack">
      <section className="card tinted-card"><div className="section-title"><div><div className="eyebrow">Optional</div><h2>Advanced calculation controls</h2></div><Calculator size={22} /></div>
        <p className="small">The safer default uses Mifflin-St Jeor. Only change these after reviewing test results.</p>
        <div className="form-grid three-col">
          <div className="field"><label>Mifflin weight</label><input type="number" step="0.05" value={state.model.bmrWeights.mifflin} onChange={(e) => setModel({ bmrWeights: { ...state.model.bmrWeights, mifflin: numeric(e.target.value) } })} /></div>
          <div className="field"><label>Cunningham weight</label><input type="number" step="0.05" value={state.model.bmrWeights.cunningham} onChange={(e) => setModel({ bmrWeights: { ...state.model.bmrWeights, cunningham: numeric(e.target.value) } })} /></div>
          <div className="field"><label>Katch weight</label><input type="number" step="0.05" value={state.model.bmrWeights.katchMcArdle} onChange={(e) => setModel({ bmrWeights: { ...state.model.bmrWeights, katchMcArdle: numeric(e.target.value) } })} /></div>
          <div className="field"><label>Projection horizon</label><div className="input-with-unit"><input type="number" min="4" max="104" value={state.model.projectionWeeks} onChange={(e) => setModel({ projectionWeeks: numeric(e.target.value) })} /><span>weeks</span></div></div>
          <div className="field"><label>Previous calibration factor</label><input type="number" min="0.85" max="1.15" step="0.005" value={state.model.calibrationFactor} onChange={(e) => setModel({ calibrationFactor: numeric(e.target.value) })} /></div>
        </div>
      </section>
      <section className="card"><OverrideField label="TDEE" mode={state.model.tdeeMode} autoValue={resolved.calculatedTdeeKcal} manualValue={state.model.manualTdeeKcal} unit="kcal/day" min={1200} max={6000} step={25} onMode={(mode) => setModel({ tdeeMode: mode })} onValue={(value) => setModel({ manualTdeeKcal: value })} /><div className="notice">Manual TDEE changes the projection baseline but leaves body composition and activity calculations linked.</div></section>
      <section className="card calibration-card"><div className="row"><div><div className="eyebrow">Rolling regression</div><h2>{resolved.calibration.status === "applied" ? "Calibration active" : resolved.calibration.status === "preview" ? "Preview only" : "Learning"}</h2></div><span className={`confidence ${resolved.calibration.confidence}`}>{resolved.calibration.confidence}</span></div><p>{resolved.calibration.calendarDays} days · {resolved.calibration.weightPoints} weigh-ins · {Math.round(resolved.calibration.intakeCoverage * 100)}% complete nutrition coverage</p><strong>{Math.round(resolved.calibration.likelyLowKcal)}–{Math.round(resolved.calibration.likelyHighKcal)} kcal likely range</strong></section>
    </div>}
  </>;
}
