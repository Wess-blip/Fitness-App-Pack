"use client";

export function OverrideField({ label, mode, autoValue, manualValue, unit, onMode, onValue, min, max, step = 1 }: {
  label: string; mode: "auto" | "manual"; autoValue: number; manualValue?: number; unit: string;
  onMode: (mode: "auto" | "manual") => void; onValue: (value: number) => void; min?: number; max?: number; step?: number;
}) {
  return (
    <div className="override-card">
      <div className="row"><div><strong>{label}</strong><div className="small muted">Calculated: {Math.round(autoValue).toLocaleString()} {unit}</div></div><div className="mini-segment"><button className={mode === "auto" ? "active" : ""} onClick={() => onMode("auto")}>Auto</button><button className={mode === "manual" ? "active" : ""} onClick={() => onMode("manual")}>Manual</button></div></div>
      {mode === "manual" && <div className="field compact"><label>Manual value</label><div className="input-with-unit"><input type="number" min={min} max={max} step={step} value={manualValue ?? Math.round(autoValue)} onChange={(e) => onValue(Number(e.target.value))} /><span>{unit}</span></div></div>}
    </div>
  );
}
