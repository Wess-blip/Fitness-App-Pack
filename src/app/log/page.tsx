"use client";

import { useMemo, useState } from "react";
import { Camera, Plus, Trash2 } from "lucide-react";
import { useAppData } from "@/components/app-data-provider";
import type { AppLogEntry } from "@/types/app-state";

type LogType = AppLogEntry["type"];
const types: LogType[] = ["Food", "Weight", "Activity", "Workout", "Measurement"];

export default function LogPage() {
  const { state, setState, syncStatus } = useAppData();
  const [type, setType] = useState<LogType>("Food");
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [protein, setProtein] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const sorted = useMemo(() => [...state.logs].sort((a, b) => b.date.localeCompare(a.date)), [state.logs]);
  const unit = ({ Food: "kcal", Weight: "kg", Activity: "active kcal", Workout: "minutes", Measurement: "cm" } as const)[type];
  function addEntry() {
    const numeric = Number(value);
    if (!title.trim() || !Number.isFinite(numeric)) return;
    const entry: AppLogEntry = {
      id: crypto.randomUUID(), type, title: title.trim(), numericValue: numeric,
      valueText: `${numeric.toLocaleString()} ${unit}${type === "Food" && protein ? ` · ${protein} g protein` : ""}`,
      date,
      metadata: type === "Food" && protein ? { proteinG: Number(protein) } : undefined,
    };
    setState((current) => ({ ...current, logs: [entry, ...current.logs], updatedAt: new Date().toISOString() }));
    setTitle(""); setValue(""); setProtein("");
  }
  function remove(id: string) { setState((current) => ({ ...current, logs: current.logs.filter((entry) => entry.id !== id), updatedAt: new Date().toISOString() })); }
  return (
    <>
      <header className="page-header colourful-header"><div><div className="eyebrow">Model refinement</div><h1>Log</h1><p style={{ margin: 0 }}>Save food, weight, activity, measurements and training. Planning still works before logs exist.</p></div><span className="save-chip">{syncStatus === "saved" ? "Cloud saved" : "Local saved"}</span></header>
      <div className="segment log-tabs">{types.map((item) => <button key={item} className={type === item ? "active" : ""} onClick={() => setType(item)}>{item}</button>)}</div>
      <section className="section card form-grid">
        <div className="field"><label>Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <div className="field"><label>Description</label><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={type === "Food" ? "e.g. chicken rice / full day total" : `e.g. ${type.toLowerCase()} entry`} /></div>
        <div className="field"><label>{unit}</label><input type="number" step="0.1" value={value} onChange={(e) => setValue(e.target.value)} placeholder={unit} /></div>
        {type === "Food" && <div className="field"><label>Protein (optional)</label><div className="input-with-unit"><input type="number" step="0.1" value={protein} onChange={(e) => setProtein(e.target.value)} /><span>g</span></div></div>}
        {type === "Food" && <button className="button secondary full" type="button"><Camera size={18} /> Analyse food photo (API-ready)</button>}
        <button className="button accent full" onClick={addEntry}><Plus size={18} /> Save {type.toLowerCase()}</button>
      </section>
      <section className="section"><div className="row"><h2>Saved entries</h2><span className="small muted">Used by Progress and 7D dashboard metrics</span></div><div className="list">{sorted.length === 0 && <div className="card muted small">Nothing logged yet.</div>}{sorted.map((entry) => <div className="list-item row" key={entry.id}><div><div className="eyebrow">{entry.type} · {entry.date}</div><strong>{entry.title}</strong><div className="small muted">{entry.valueText}</div></div><button className="icon-button" onClick={() => remove(entry.id)} aria-label="Delete entry"><Trash2 size={16} /></button></div>)}</div></section>
    </>
  );
}
