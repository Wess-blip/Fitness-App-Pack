"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { PPL_PROGRAM } from "@/data/workout-program";
import { buildPplSchedule } from "@/lib/engine";

const dayShort = ["S", "M", "T", "W", "T", "F", "S"];

export default function PlanPage() {
  const [frequency, setFrequency] = useState<3 | 6>(3);
  const [selected, setSelected] = useState<number[]>([2, 4, 6]);
  const [openGuide, setOpenGuide] = useState<"push" | "pull" | "legs" | null>(null);

  function toggleDay(day: number) {
    setSelected((current) => current.includes(day) ? current.filter((x) => x !== day) : current.length < frequency ? [...current, day] : current);
  }
  function changeFrequency(next: 3 | 6) {
    setFrequency(next);
    setSelected(next === 3 ? [2, 4, 6] : [1, 2, 3, 4, 5, 6]);
  }
  const schedule = useMemo(() => {
    try { return buildPplSchedule(selected, frequency); } catch { return []; }
  }, [selected, frequency]);

  return (
    <>
      <header className="page-header"><div><div className="eyebrow">Weekly setup</div><h1>Plan</h1><p style={{ margin: 0 }}>Pick PPL once or twice weekly. The sequence stays in order.</p></div></header>
      <section className="card">
        <div className="segment" style={{ gridTemplateColumns: "repeat(2,1fr)" }}>
          <button className={frequency === 3 ? "active" : ""} onClick={() => changeFrequency(3)}>PPL once · 3 days</button>
          <button className={frequency === 6 ? "active" : ""} onClick={() => changeFrequency(6)}>PPL twice · 6 days</button>
        </div>
        <div className="section day-picker">
          {dayShort.map((label, day) => <button key={day} className={selected.includes(day) ? "day-button selected" : "day-button"} onClick={() => toggleDay(day)}>{label}</button>)}
        </div>
        <p className="small">Choose exactly {frequency} days. Missed sessions should move to the next available day while preserving Push → Pull → Legs.</p>
      </section>

      <section className="section list">
        {schedule.map((item) => {
          const guide = PPL_PROGRAM.find((x) => x.id === item.programDayId)!;
          return (
            <article key={`${item.weekday}-${item.sequence}`} className="list-item">
              <div className="row"><div><div className="eyebrow">{item.weekdayLabel}</div><h2 style={{ margin: "4px 0" }}>{item.name}</h2><div className="small muted">{guide.exercises.length} exercises · RIR-based progression</div></div><button className="button secondary" onClick={() => setOpenGuide(openGuide === guide.id ? null : guide.id)}>Guide</button></div>
              {openGuide === guide.id && <div className="section"><Image className="workout-image" src={guide.image} alt={`${guide.name} workout guide`} width={1100} height={1400} priority={false} /><div className="list" style={{ marginTop: 12 }}>{guide.exercises.map((exercise) => <div className="small" key={exercise.id}><strong>{exercise.name}</strong> · {exercise.setsMin}{exercise.setsMax !== exercise.setsMin ? `–${exercise.setsMax}` : ""} × {exercise.repsMin}–{exercise.repsMax}</div>)}</div></div>}
            </article>
          );
        })}
        {schedule.length === 0 && <div className="notice warning">Select exactly {frequency} days to generate the week.</div>}
      </section>

      <section className="section card"><div className="eyebrow">Optional module</div><h2 style={{ marginTop: 6 }}>Treadmill</h2><p className="small">Enable it by duration or target active calories. Leave it off and the engine records zero by design—without pretending missing data is a real session.</p></section>
    </>
  );
}
