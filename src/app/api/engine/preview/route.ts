import { NextResponse } from "next/server";
import { z } from "zod";
import { calculateTdee, projectBodyComposition } from "@/lib/engine";

const schema = z.object({
  startDate: z.string(),
  profile: z.object({
    sex: z.enum(["male", "female"]), ageYears: z.number().positive(), heightCm: z.number().positive(), weightKg: z.number().positive(),
    bodyFatPct: z.number().min(0.03).max(0.7).optional(), bodyFatConfidence: z.enum(["none", "low", "medium", "high"]).optional(),
    trainingExperience: z.enum(["novice", "intermediate", "advanced"]),
  }),
  nutrition: z.object({ calories: z.number().positive(), proteinG: z.number().nonnegative().optional(), carbsG: z.number().nonnegative().optional(), fatG: z.number().nonnegative().optional() }),
  activity: z.any(),
  goal: z.any(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { profile, nutrition, activity, goal, startDate } = parsed.data;
  const tdee = calculateTdee(profile, nutrition, activity);
  const scenarios = ["conservative", "expected", "optimistic"].map((scenario) => projectBodyComposition({ startDate, profile, goal, activity, scenario: scenario as "conservative" | "expected" | "optimistic", weeks: 52 }));
  return NextResponse.json({ tdee, scenarios });
}
