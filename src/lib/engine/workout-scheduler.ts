import type { ScheduledWorkout } from "@/types/fitness";

const labels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const sequence = [
  { id: "push" as const, name: "Push" },
  { id: "pull" as const, name: "Pull" },
  { id: "legs" as const, name: "Legs + Core" },
];

export function buildPplSchedule(selectedWeekdays: number[], frequency: 3 | 6): ScheduledWorkout[] {
  const unique = [...new Set(selectedWeekdays)].sort((a, b) => a - b);
  if (unique.length !== frequency) throw new Error(`Choose exactly ${frequency} unique weekdays.`);
  return unique.map((weekday, index) => {
    const template = sequence[index % 3];
    const rotation = frequency === 6 ? (index < 3 ? "A" : "B") : "";
    return {
      weekday,
      weekdayLabel: labels[weekday],
      sequence: index + 1,
      programDayId: template.id,
      name: `${template.name}${rotation ? ` ${rotation}` : ""}`,
    };
  });
}
