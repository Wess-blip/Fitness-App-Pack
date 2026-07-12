"use client";

import { useMemo, useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { useAppData } from "@/components/app-data-provider";
import { UnitNumberInput } from "@/components/unit-number-input";
import { ACTIVITY_CATALOG } from "@/data/activity-catalog";
import { activeCaloriesFromMet } from "@/lib/engine";
import { cmToUnit, kgToUnit } from "@/lib/units";
import type { AppFieldUnits, AppLogEntry } from "@/types/app-state";

type LogType = "Food" | "Weight" | "Activity" | "Measurement";
const types: LogType[] = ["Food", "Weight", "Measurement", "Activity"];
const number = (value: string) => Number.isFinite(Number(value)) ? Number(value) : 0;

export default function LogPage() {
  const { state, setState, patch, syncStatus } = useAppData();
  const [type, setType] = useState<LogType>("Food");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [foodScope, setFoodScope] = useState<"item" | "day">("item");
  const [measurement, setMeasurement] = useState<"waist" | "neck" | "hips">("waist");
  const [activityId, setActivityId] = useState(ACTIVITY_CATALOG[0].id);
  const [duration, setDuration] = useState("45");
  const [activityMode, setActivityMode] = useState<"auto" | "manual">("auto");
  const fieldUnits = state.profile.fieldUnits;
  const wUnit = fieldUnits.logWeight;
  const lUnit = fieldUnits.logMeasurement;
  const setFieldUnit = <K extends keyof AppFieldUnits>(field: K, unit: AppFieldUnits[K]) => patch("profile", { fieldUnits: { ...fieldUnits, [field]: unit } });
  const activity = ACTIVITY_CATALOG.find((item) => item.id === activityId) ?? ACTIVITY_CATALOG[0];
  const autoActivityKcal = activeCaloriesFromMet(state.baseline.currentWeightKg, number(duration), activity.met);
  const displayedActivityKcal = activityMode === "manual" ? number(value) : autoActivityKcal;
  const sorted = useMemo(() => [...state.logs].sort((a, b) => b.date.localeCompare(a.date)), [state.logs]);
  const measurementOptions = state.profile.sex === "female" ? ["waist", "neck", "hips"] as const : ["waist", "neck"] as const;

  function saveEntry() {
    let entry: AppLogEntry | null = null;
    if (type === "Food") {
      if (!description.trim() || number(value) <= 0) return;
      entry = { id: crypto.randomUUID(), type, title: description.trim(), numericValue: number(value), valueText: `${Math.round(number(value))} kcal${protein ? ` · ${number(protein)} g protein` : ""}`, date, metadata: { proteinG: number(protein), carbsG: number(carbs), fatG: number(fat), dayTotal: foodScope === "day" } };
    }
    if (type === "Weight") {
      if (number(value) <= 0) return;
      const kg = number(value);
      entry = { id: crypto.randomUUID(), type, title: "Morning weight", numericValue: kg, valueText: `${kgToUnit(kg, wUnit).toFixed(1)} ${wUnit}`, date };
    }
    if (type === "Measurement") {
      if (number(value) <= 0) return;
      const cm = number(value);
      entry = { id: crypto.randomUUID(), type, title: measurement[0].toUpperCase() + measurement.slice(1), numericValue: cm, valueText: `${cmToUnit(cm, lUnit).toFixed(1)} ${lUnit}`, date, metadata: { measurement } };
    }
    if (type === "Activity") {
      if (number(duration) <= 0 || displayedActivityKcal <= 0) return;
      entry = { id: crypto.randomUUID(), type, title: activity.label, numericValue: displayedActivityKcal, valueText: `${number(duration)} min · ${Math.round(displayedActivityKcal)} active kcal`, date, metadata: { activityId, durationMin: number(duration), met: activity.met, calculationMode: activityMode } };
    }
    if (!entry) return;
    setState((current) => {
      const next = { ...current, logs: [entry!, ...current.logs], updatedAt: new Date().toISOString() };
      if (type === "Weight") next.baseline = { ...current.baseline, currentWeightKg: entry!.numericValue! };
      if (type === "Measurement") {
        const key = measurement === "hips" ? "hipCm" : measurement === "waist" ? "waistCm" : "neckCm";
        next.baseline = { ...current.baseline, [key]: entry!.numericValue! };
      }
      return next;
    });
    setValue("");
    if (type === "Food") { setDescription(""); setProtein(""); setCarbs(""); setFat(""); }
  }

  function remove(id: string) {
    setState((current) => ({ ...current, logs: current.logs.filter((entry) => entry.id !== id), updatedAt: new Date().toISOString() }));
  }

  return <>
    <header className="page-header colourful-header log-hero"><div><div className="eyebrow">Fast daily entry</div><h1>Log</h1><p>Planning works without logs. Complete food days and morning weights gradually improve TDEE calibration.</p></div><span className="save-chip">{syncStatus === "saved" ? "Cloud saved" : "Saved"}</span></header>
    <div className="segment log-tabs">{types.map((item) => <button key={item} className={type === item ? "active" : ""} onClick={() => { setType(item); setValue(""); }}>{item}</button>)}</div>

    <section className="section card quick-log-card">
      <div className="field"><label>Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>

      {type === "Food" && <div className="form-grid two-col">
        <div className="field full-span"><label>Food or meal description</label><input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. chicken rice, less sauce" /></div>
        <div className="field"><label>Entry type</label><select value={foodScope} onChange={(e) => setFoodScope(e.target.value as typeof foodScope)}><option value="item">Meal / food item</option><option value="day">Complete daily total</option></select><small>Only complete daily totals are used for regression.</small></div>
        <div className="field"><label>Calories</label><div className="input-with-unit"><input type="number" value={value} onChange={(e) => setValue(e.target.value)} /><span>kcal</span></div></div>
        <div className="field"><label>Protein (optional)</label><div className="input-with-unit"><input type="number" value={protein} onChange={(e) => setProtein(e.target.value)} /><span>g</span></div></div>
        <div className="field"><label>Carbs (optional)</label><div className="input-with-unit"><input type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} /><span>g</span></div></div>
        <div className="field"><label>Fat (optional)</label><div className="input-with-unit"><input type="number" value={fat} onChange={(e) => setFat(e.target.value)} /><span>g</span></div></div>
        <div className="notice full-span">Food-photo AI is not included, so there is no OpenAI usage charge. Enter the label calories or your best estimate.</div>
      </div>}

      {type === "Weight" && <div className="fast-entry"><div><div className="eyebrow">Morning weight</div><h2>No description needed</h2><p className="small">Saving this also updates your current baseline weight.</p></div><div className="field"><label>Weight</label><UnitNumberInput label="Logged weight" kind="weight" value={value === "" ? undefined : number(value)} unit={wUnit} onValue={(kg) => setValue(String(kg))} onUnit={(unit) => setFieldUnit("logWeight", unit as AppFieldUnits["logWeight"])} /></div></div>}

      {type === "Measurement" && <div className="form-grid two-col">
        <div className="field"><label>Measurement</label><select value={measurement} onChange={(e) => setMeasurement(e.target.value as typeof measurement)}>{measurementOptions.map((item) => <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}</select></div>
        <div className="field"><label>Value</label><UnitNumberInput label={`${measurement} measurement`} kind="length" value={value === "" ? undefined : number(value)} unit={lUnit} onValue={(cm) => setValue(String(cm))} onUnit={(unit) => setFieldUnit("logMeasurement", unit as AppFieldUnits["logMeasurement"])} /></div>
        <div className="notice full-span">The list automatically shows waist and neck for males, and adds hips for females.</div>
      </div>}

      {type === "Activity" && <div className="form-grid two-col">
        <div className="field"><label>Activity</label><select value={activityId} onChange={(e) => setActivityId(e.target.value as typeof activityId)}>{ACTIVITY_CATALOG.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div>
        <div className="field"><label>Duration</label><div className="input-with-unit"><input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} /><span>min</span></div></div>
        <div className="override-card full-span"><div className="row"><div><strong>Active calories</strong><div className="small muted">Auto: {Math.round(autoActivityKcal)} kcal from duration, body weight and activity intensity</div></div><div className="mini-segment"><button className={activityMode === "auto" ? "active" : ""} onClick={() => setActivityMode("auto")}>Auto</button><button className={activityMode === "manual" ? "active" : ""} onClick={() => setActivityMode("manual")}>Manual</button></div></div>{activityMode === "manual" && <div className="field compact"><label>Manual active calories</label><div className="input-with-unit"><input type="number" value={value} onChange={(e) => setValue(e.target.value)} /><span>kcal</span></div></div>}</div>
      </div>}

      <button className="button accent full save-log" onClick={saveEntry}><Plus size={18} />Save {type.toLowerCase()}</button>
    </section>

    <section className="section"><div className="row"><h2>Recent entries</h2><span className="small muted">{state.logs.length} saved</span></div><div className="list">{sorted.length === 0 && <div className="card empty-state"><Check size={20} /><strong>Ready when you are</strong><span>No entries yet.</span></div>}{sorted.map((entry) => <div className="list-item row" key={entry.id}><div><div className="eyebrow">{entry.type} · {entry.date}</div><strong>{entry.title}</strong><div className="small muted">{entry.valueText}</div></div><button className="icon-button" onClick={() => remove(entry.id)} aria-label="Delete entry"><Trash2 size={16} /></button></div>)}</div></section>
  </>;
}
