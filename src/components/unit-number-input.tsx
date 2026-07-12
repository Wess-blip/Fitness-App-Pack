"use client";

import type { LengthUnit, SpeedUnit, WeightUnit } from "@/types/app-state";
import { cmToUnit, formatInputNumber, kgToUnit, kmhToUnit, unitToCm, unitToKg, unitToKmh } from "@/lib/units";

type UnitKind = "weight" | "length" | "speed";
type Unit = WeightUnit | LengthUnit | SpeedUnit;

const OPTIONS = {
  weight: [["kg", "kg"], ["lb", "lb"]],
  length: [["cm", "cm"], ["in", "in"]],
  speed: [["kmh", "km/h"], ["mph", "mph"]],
} as const;

function toDisplay(value: number, kind: UnitKind, unit: Unit) {
  if (kind === "weight") return kgToUnit(value, unit as WeightUnit);
  if (kind === "length") return cmToUnit(value, unit as LengthUnit);
  return kmhToUnit(value, unit as SpeedUnit);
}

function toCanonical(value: number, kind: UnitKind, unit: Unit) {
  if (kind === "weight") return unitToKg(value, unit as WeightUnit);
  if (kind === "length") return unitToCm(value, unit as LengthUnit);
  return unitToKmh(value, unit as SpeedUnit);
}

export function UnitNumberInput({ label, kind, value, unit, onValue, onUnit, step = 0.1, decimals = 2 }: {
  label: string;
  kind: UnitKind;
  value?: number;
  unit: Unit;
  onValue: (canonicalValue: number) => void;
  onUnit: (unit: Unit) => void;
  step?: number;
  decimals?: number;
}) {
  const displayed = value === undefined ? undefined : toDisplay(value, kind, unit);
  return <div className="input-with-unit unit-number-input">
    <input aria-label={label} type="number" step={step} value={formatInputNumber(displayed, decimals)} onChange={(event) => {
      const next = Number(event.target.value);
      if (Number.isFinite(next)) onValue(toCanonical(next, kind, unit));
    }} />
    <select aria-label={`${label} unit`} value={unit} onChange={(event) => onUnit(event.target.value as Unit)}>
      {OPTIONS[kind].map(([value, text]) => <option value={value} key={value}>{text}</option>)}
    </select>
  </div>;
}
