export const KG_PER_LB = 0.45359237;
export const CM_PER_IN = 2.54;

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
