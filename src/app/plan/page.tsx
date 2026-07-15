"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useAppData } from "@/components/app-data-provider";
import { SyncStatusBadge } from "@/components/sync-status-badge";
import { PPL_PROGRAM } from "@/data/workout-program";
import { buildPplSchedule } from "@/lib/engine";

const dayShort = ["S", "M", "T", "W", "T", "F", "S"];

export default function PlanPage() {
  const { state, setState } = useAppData();
  const frequency = state.plan.frequency;
  const selected = state.plan.weekdays;
  const [openGuide, setOpenGuide] = useState<"push" | "pull" | "legs" | null>(null);
  function savePlan(next: Partial<typeof state.plan>) {
    setState((current) => ({ ...current, plan: { ...current.plan, ...next }, goals: { ...current.goals, sessionsPerWeek: next.frequency ?? current.goals.sessionsPerWeek }, updatedAt: new Date().toISOString() }));
  }
  function toggleDay(day: number) {
    const next = selected.includes(day) ? selected.filter((x) => x !== day) : selected.length < frequency ? [...selected, day] : selected;
    savePlan({ weekdays: next });
  }
  function changeFrequency(next: 3 | 6) { savePlan({ frequency: next, weekdays: next === 3 ? [2, 4, 6] : [1, 2, 3, 4, 5, 6] }); }
  const schedule = useMemo(() => { try { return buildPplSchedule(selected, frequency); } catch { return []; } }, [selected, frequency]);
  return (
    <>
      <header className="page-header colourful-header"><div><div className="eyebrow">Saved weekly setup</div><h1>Plan</h1><p style={{ margin: 0 }}>Pick PPL once or twice weekly. Your chosen days are user-specific and saved with the rest of the model.</p></div><SyncStatusBadge compact /></header>
      <section className="card tinted-card">
        <div className="segment" style={{ gridTemplateColumns: "repeat(2,1fr)" }}><button className={frequency === 3 ? "active" : ""} onClick={() => changeFrequency(3)}>PPL once · 3 days</button><button className={frequency === 6 ? "active" : ""} onClick={() => changeFrequency(6)}>PPL twice · 6 days</button></div>
        <div className="section day-picker">{dayShort.map((label, day) => <button key={day} className={selected.includes(day) ? "day-button selected" : "day-button"} onClick={() => toggleDay(day)}>{label}</button>)}</div>
        <p className="small">Choose exactly {frequency} days. The plan preserves Push → Pull → Legs even if the selected weekdays are not consecutive.</p>
      </section>
      <section className="section list">{schedule.map((item) => {
        const guide = PPL_PROGRAM.find((x) => x.id === item.programDayId)!;
        return <article key={`${item.weekday}-${item.sequence}`} className="list-item"><div className="row"><div><div className="eyebrow">{item.weekdayLabel}</div><h2 style={{ margin: "4px 0" }}>{item.name}</h2><div className="small muted">{guide.exercises.length} exercises · RIR-based progression</div></div><button className="button secondary" onClick={() => setOpenGuide(openGuide === guide.id ? null : guide.id)}>{openGuide === guide.id ? "Close" : "Guide"}</button></div>{openGuide === guide.id && <div className="section"><Image className="workout-image" src={guide.image} alt={`${guide.name} workout guide`} width={1100} height={1400} /><div className="list" style={{ marginTop: 12 }}>{guide.exercises.map((exercise) => <div className="small" key={exercise.id}><strong>{exercise.name}</strong> · {exercise.setsMin}{exercise.setsMax !== exercise.setsMin ? `–${exercise.setsMax}` : ""} × {exercise.repsMin}–{exercise.repsMax}</div>)}</div></div>}</article>;
      })}{schedule.length === 0 && <div className="notice warning">Select exactly {frequency} days to generate the week.</div>}</section>
      <section className="section card"><div className="eyebrow">Linked module</div><h2 style={{ marginTop: 6 }}>Activity and treadmill</h2><p className="small">Workout duration, MET assumptions and optional treadmill settings are edited in Setup → Activity. They flow into burn, TDEE and projections without changing this visual workout plan.</p></section>
    </>
  );
}
