"use client";

import { useEffect, useMemo, useState } from "react";
import { Camera, Plus, Trash2 } from "lucide-react";

type LogType = "Food" | "Weight" | "Activity" | "Workout";
type Entry = { id: string; type: LogType; title: string; value: string; createdAt: string };

export default function LogPage() {
  const [type, setType] = useState<LogType>("Food");
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [entries, setEntries] = useState<Entry[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = window.localStorage.getItem("formlab-demo-logs");
    return saved ? JSON.parse(saved) as Entry[] : [];
  });
  useEffect(() => {
    localStorage.setItem("formlab-demo-logs", JSON.stringify(entries));
  }, [entries]);

  const placeholder = useMemo(() => ({
    Food: "e.g. chicken rice",
    Weight: "e.g. morning weigh-in",
    Activity: "e.g. Apple Watch active energy",
    Workout: "e.g. Push Day",
  })[type], [type]);
  const valuePlaceholder = ({ Food: "Calories", Weight: "kg", Activity: "Active kcal", Workout: "Duration / note" } as const)[type];

  function addEntry() {
    if (!title.trim() || !value.trim()) return;
    setEntries((current) => [{ id: crypto.randomUUID(), type, title: title.trim(), value: value.trim(), createdAt: new Date().toISOString() }, ...current]);
    setTitle(""); setValue("");
  }

  return (
    <>
      <header className="page-header"><div><div className="eyebrow">Quick entry</div><h1>Log</h1><p style={{ margin: 0 }}>Use one screen for food, weight, activity and training.</p></div></header>
      <div className="segment">
        {(["Food", "Weight", "Activity", "Workout"] as LogType[]).map((item) => <button key={item} className={type === item ? "active" : ""} onClick={() => setType(item)}>{item}</button>)}
      </div>

      <section className="section card form-grid">
        <div className="field"><label>Description</label><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={placeholder} /></div>
        <div className="field"><label>{valuePlaceholder}</label><input value={value} onChange={(e) => setValue(e.target.value)} placeholder={valuePlaceholder} /></div>
        {type === "Food" && <button className="button secondary full" type="button"><Camera size={18} /> Analyse food photo (API-ready)</button>}
        <button className="button accent full" onClick={addEntry}><Plus size={18} /> Add {type.toLowerCase()}</button>
      </section>

      <section className="section">
        <div className="row"><h2>Recent entries</h2><span className="small muted">Stored locally in demo mode</span></div>
        <div className="list">
          {entries.length === 0 && <div className="card muted small">Nothing logged yet.</div>}
          {entries.map((entry) => (
            <div className="list-item row" key={entry.id}>
              <div><div className="eyebrow">{entry.type}</div><strong>{entry.title}</strong><div className="small muted">{entry.value}</div></div>
              <button className="button secondary" onClick={() => setEntries((items) => items.filter((x) => x.id !== entry.id))} aria-label="Delete entry"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
