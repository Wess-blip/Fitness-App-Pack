import type { ProgramDayTemplate } from "@/types/fitness";

export const PPL_PROGRAM: ProgramDayTemplate[] = [
  {
    id: "push",
    name: "Push Day",
    image: "/workout-guides/push-day.png",
    stretches: ["Chest opener — 20–30 sec", "Shoulder stretch — 20–30 sec/side", "Overhead triceps stretch — 20–30 sec/side", "Chest + biceps stretch — 20–30 sec"],
    exercises: [
      { id: "incline-bench", name: "Barbell Incline Bench Press", setsMin: 3, setsMax: 3, repsMin: 8, repsMax: 10, targetRir: 2, restSeconds: 120, notes: "30–45° bench. Shoulder blades retracted; lower to upper chest.", muscles: ["upper chest", "front delts", "triceps"] },
      { id: "chest-fly", name: "Chest Fly Machine", setsMin: 2, setsMax: 3, repsMin: 10, repsMax: 15, targetRir: 1, restSeconds: 75, notes: "Slight elbow bend; squeeze chest without slamming the stack.", muscles: ["chest"] },
      { id: "lateral-raise", name: "Dumbbell Lateral Raise", setsMin: 3, setsMax: 3, repsMin: 12, repsMax: 20, targetRir: 1, restSeconds: 75, notes: "Lead with elbows and avoid shrugging.", muscles: ["side delts"] },
      { id: "skull-crusher", name: "EZ-Bar Skull Crusher", setsMin: 3, setsMax: 3, repsMin: 8, repsMax: 12, targetRir: 1, restSeconds: 90, notes: "Keep upper arms still and lower behind the forehead.", muscles: ["triceps"] },
      { id: "rope-pushdown", name: "Rope Triceps Pushdown", setsMin: 2, setsMax: 2, repsMin: 10, repsMax: 15, targetRir: 1, restSeconds: 75, notes: "Elbows pinned; separate rope at the bottom.", muscles: ["triceps"] },
    ],
  },
  {
    id: "pull",
    name: "Pull Day",
    image: "/workout-guides/pull-day.png",
    stretches: ["Overhead lat stretch — 20–30 sec/side", "Rear-delt stretch — 20–30 sec/side", "Upper-trap stretch — 20–30 sec/side", "Upper-back stretch — 20–30 sec", "Chest + biceps stretch — 20–30 sec"],
    exercises: [
      { id: "lat-pulldown", name: "Lat Pulldown", setsMin: 3, setsMax: 3, repsMin: 8, repsMax: 12, targetRir: 2, restSeconds: 120, notes: "Pull elbows down toward ribs; use a full grip.", muscles: ["lats", "biceps", "upper back"] },
      { id: "machine-row", name: "Machine / Chest-Supported Row", setsMin: 2, setsMax: 3, repsMin: 8, repsMax: 12, targetRir: 2, restSeconds: 120, notes: "Keep chest supported and pause at peak contraction.", muscles: ["mid back", "lats", "rhomboids"] },
      { id: "face-pull", name: "Face Pull", setsMin: 2, setsMax: 2, repsMin: 12, repsMax: 15, targetRir: 2, restSeconds: 75, notes: "Pull toward eyes/forehead; lead with elbows.", muscles: ["rear delts", "upper back", "rotator cuff"] },
      { id: "incline-curl", name: "Incline Dumbbell Curl", setsMin: 3, setsMax: 3, repsMin: 8, repsMax: 12, targetRir: 1, restSeconds: 75, notes: "Keep shoulders back and control the stretch.", muscles: ["biceps"] },
      { id: "hammer-curl", name: "Hammer Curl", setsMin: 2, setsMax: 3, repsMin: 10, repsMax: 15, targetRir: 1, restSeconds: 75, notes: "Neutral grip; do not rock the body.", muscles: ["brachialis", "forearms", "biceps"] },
      { id: "external-rotation", name: "Cable External Rotation", setsMin: 1, setsMax: 1, repsMin: 12, repsMax: 15, targetRir: 3, restSeconds: 60, notes: "Very light load; elbow stays pinned.", muscles: ["rotator cuff"] },
    ],
  },
  {
    id: "legs",
    name: "Legs + Core Day",
    image: "/workout-guides/leg-day.png",
    stretches: ["Quad stretch — 20–30 sec/side", "Hamstring stretch — 20–30 sec/side", "Calf stretch — 20–30 sec/side", "Hip-flexor stretch — 20–30 sec/side", "Glute stretch — 20–30 sec/side"],
    exercises: [
      { id: "rdl", name: "Romanian Deadlift", setsMin: 3, setsMax: 3, repsMin: 8, repsMax: 10, targetRir: 2, restSeconds: 150, notes: "Hips back, bar close, stop at a controlled hamstring stretch.", muscles: ["hamstrings", "glutes", "back"] },
      { id: "leg-press", name: "Leg Press", setsMin: 3, setsMax: 3, repsMin: 8, repsMax: 10, targetRir: 2, restSeconds: 150, notes: "Feet shoulder-width; knees track over toes.", muscles: ["quads", "glutes"] },
      { id: "calf-press", name: "Leg Press Calf Raise", setsMin: 3, setsMax: 3, repsMin: 12, repsMax: 15, targetRir: 1, restSeconds: 75, notes: "Use the same machine; deep stretch and strong squeeze.", muscles: ["calves"] },
      { id: "hip-machine", name: "Hip Abductor / Adductor Machine", setsMin: 2, setsMax: 3, repsMin: 12, repsMax: 15, targetRir: 1, restSeconds: 75, notes: "Train both directions slowly without momentum.", muscles: ["glutes", "inner thighs"] },
      { id: "machine-crunch", name: "Machine Crunch / Sit-Up", setsMin: 2, setsMax: 3, repsMin: 10, repsMax: 15, targetRir: 1, restSeconds: 60, notes: "Ribs toward hips; control the return.", muscles: ["abs"] },
    ],
  },
];
