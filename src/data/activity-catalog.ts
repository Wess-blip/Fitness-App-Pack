export const ACTIVITY_CATALOG = [
  { id: "weights-moderate", label: "Gym - weights (moderate)", met: 3.5 },
  { id: "weights-vigorous", label: "Gym - weights (vigorous)", met: 6 },
  { id: "walking", label: "Walking (brisk)", met: 4.8 },
  { id: "running", label: "Running", met: 8.3 },
  { id: "cycling", label: "Cycling (moderate)", met: 7.5 },
  { id: "swimming", label: "Swimming laps", met: 6 },
  { id: "football", label: "Football / soccer", met: 7 },
  { id: "basketball", label: "Basketball", met: 6.5 },
  { id: "badminton", label: "Badminton", met: 5.5 },
  { id: "tennis", label: "Tennis", met: 7.3 },
  { id: "yoga", label: "Yoga", met: 2.5 },
  { id: "other", label: "Other activity", met: 4 },
] as const;

export type ActivityCatalogId = typeof ACTIVITY_CATALOG[number]["id"];
