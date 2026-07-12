import type { AppFieldUnits, LengthUnit, SpeedUnit, WeightUnit } from "@/types/app-state";

export const KG_PER_LB = 0.45359237;
export const CM_PER_IN = 2.54;
export const KM_PER_MILE = 1.609344;

export function kgToDisplay(kg: number, system: "metric" | "imperial") {
  return system === "imperial" ? kg / KG_PER_LB : kg;
}

export function displayToKg(value: number, system: "metric" | "imperial") {
  return system === "imperial" ? value * KG_PER_LB : value;
}

export function cmToDisplay(cm: number, system: "metric" | "imperial") {
  return system === "imperial" ? cm / CM_PER_IN : cm;
}

export function displayToCm(value: number, system: "metric" | "imperial") {
  return system === "imperial" ? value * CM_PER_IN : value;
}

export function weightUnit(system: "metric" | "imperial") {
  return system === "imperial" ? "lb" : "kg";
}

export function lengthUnit(system: "metric" | "imperial") {
  return system === "imperial" ? "in" : "cm";
}

export function kgToUnit(kg: number, unit: WeightUnit) {
  return unit === "lb" ? kg / KG_PER_LB : kg;
}

export function unitToKg(value: number, unit: WeightUnit) {
  return unit === "lb" ? value * KG_PER_LB : value;
}

export function cmToUnit(cm: number, unit: LengthUnit) {
  return unit === "in" ? cm / CM_PER_IN : cm;
}

export function unitToCm(value: number, unit: LengthUnit) {
  return unit === "in" ? value * CM_PER_IN : value;
}

export function kmhToUnit(kmh: number, unit: SpeedUnit) {
  return unit === "mph" ? kmh / KM_PER_MILE : kmh;
}

export function unitToKmh(value: number, unit: SpeedUnit) {
  return unit === "mph" ? value * KM_PER_MILE : value;
}

/** Avoids binary floating-point tails such as 15.600000000000001 in number inputs. */
export function formatInputNumber(value: number | undefined, decimals = 2) {
  if (value === undefined || !Number.isFinite(value)) return "";
  return String(Number(value.toFixed(decimals)));
}

export function fieldUnitsFromSystem(system: "metric" | "imperial"): AppFieldUnits {
  const weight: WeightUnit = system === "imperial" ? "lb" : "kg";
  const length: LengthUnit = system === "imperial" ? "in" : "cm";
  const speed: SpeedUnit = system === "imperial" ? "mph" : "kmh";
  return {
    height: length,
    bodyWeight: weight,
    waist: length,
    neck: length,
    hips: length,
    targetWeight: weight,
    targetLeanMass: weight,
    logWeight: weight,
    logMeasurement: length,
    treadmillSpeed: speed,
  };
}
