import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const payloadSchema = z.object({
  userId: z.string().uuid(),
  samples: z.array(z.object({
    type: z.enum(["weight", "active_energy", "resting_energy", "steps", "workout"]),
    startAt: z.string().datetime(),
    endAt: z.string().datetime().optional(),
    value: z.number(),
    unit: z.string(),
    sourceName: z.string().optional(),
    sourceId: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })).max(5000),
});

function sha256(value: string) { return createHash("sha256").update(value).digest(); }

export async function POST(request: Request) {
  const token = request.headers.get("x-health-sync-token") ?? "";
  const parsed = payloadSchema.safeParse(await request.json());
  if (!parsed.success || !token) return NextResponse.json({ error: "Invalid health import request." }, { status: 400 });

  try {
    const supabase = createServiceClient();
    const { data: connection, error } = await supabase.from("health_connections").select("token_hash, active").eq("user_id", parsed.data.userId).eq("provider", "apple_health").single();
    if (error || !connection?.active) return NextResponse.json({ error: "Health connection not found." }, { status: 401 });
    const expected = Buffer.from(connection.token_hash, "hex");
    const actual = sha256(token);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return NextResponse.json({ error: "Invalid sync token." }, { status: 401 });

    const rows = parsed.data.samples.map((sample) => ({
      user_id: parsed.data.userId,
      provider: "apple_health",
      sample_type: sample.type,
      start_at: sample.startAt,
      end_at: sample.endAt ?? sample.startAt,
      numeric_value: sample.value,
      unit: sample.unit,
      source_name: sample.sourceName,
      external_id: sample.sourceId,
      metadata: sample.metadata ?? {},
    }));
    const { error: insertError } = await supabase.from("health_samples").upsert(rows, { onConflict: "user_id,provider,sample_type,external_id" });
    if (insertError) throw insertError;
    return NextResponse.json({ imported: rows.length });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Health import failed." }, { status: 500 });
  }
}
