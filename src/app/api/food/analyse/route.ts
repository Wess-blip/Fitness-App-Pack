import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";

export const runtime = "nodejs";
const requestSchema = z.object({ imageDataUrl: z.string().startsWith("data:image/"), context: z.string().max(1000).optional() });

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "A valid image data URL is required." }, { status: 400 });
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 503 });
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.create({
    model: "gpt-5-mini",
    input: [{ role: "user", content: [
      { type: "input_text", text: `Estimate this meal. Return concise JSON-ready values. Context: ${parsed.data.context ?? "none"}. Include foods, caloriesLow, caloriesHigh, proteinG, carbsG, fatG, confidence and clarificationQuestions. Do not claim exactness.` },
      { type: "input_image", image_url: parsed.data.imageDataUrl, detail: "high" },
    ] }],
    text: { format: { type: "json_schema", name: "meal_estimate", strict: true, schema: {
      type: "object", additionalProperties: false,
      properties: {
        foods: { type: "array", items: { type: "string" } }, caloriesLow: { type: "number" }, caloriesHigh: { type: "number" },
        proteinG: { type: "number" }, carbsG: { type: "number" }, fatG: { type: "number" }, confidence: { type: "string", enum: ["low", "medium", "high"] },
        clarificationQuestions: { type: "array", items: { type: "string" } },
      },
      required: ["foods", "caloriesLow", "caloriesHigh", "proteinG", "carbsG", "fatG", "confidence", "clarificationQuestions"],
    } } },
  });
  return NextResponse.json(JSON.parse(response.output_text));
}
