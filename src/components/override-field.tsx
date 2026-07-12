"use client";

export function OverrideField({ label, mode, autoValue, manualValue, unit, onMode, onValue, onUnit, unitOptions, min, max, step = 1 }: {
  label: string; mode: "auto" | "manual"; autoValue: number; manualValue?: number; unit: string;
  onMode: (mode: "auto" | "manual") => void; onValue: (value: number) => void; onUnit?: (unit: string) => void;
  unitOptions?: Array<{ value: string; label: string }>;
  min?: number; max?: number; step?: number;
}) {
  return (
    <div className="override-card">
      <div className="row"><div><strong>{label}</strong><div className="small muted">Calculated: {Math.round(autoValue).toLocaleString()} {unit}</div></div><div className="mini-segment"><button className={mode === "auto" ? "active" : ""} onClick={() => onMode("auto")}>Auto</button><button className={mode === "manual" ? "active" : ""} onClick={() => onMode("manual")}>Manual</button></div></div>
      {mode === "manual" && <div className="field compact"><label>Manual value</label><div className="input-with-unit"><input type="number" min={min} max={max} step={step} value={manualValue ?? Math.round(autoValue)} onChange={(e) => onValue(Number(e.target.value))} />{unitOptions && onUnit ? <select aria-label={`${label} unit`} value={unit} onChange={(event) => onUnit(event.target.value)}>{unitOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <span>{unit}</span>}</div></div>}
    </div>
  );
}
