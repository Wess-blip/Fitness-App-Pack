import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!bearer || !url || !publishable) return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  const authClient = createClient(url, publishable, { auth: { persistSession: false } });
  const { data, error } = await authClient.auth.getUser(bearer);
  if (error || !data.user) return NextResponse.json({ error: "Invalid session." }, { status: 401 });

  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const service = createServiceClient();
  const { error: upsertError } = await service.from("health_connections").upsert({
    user_id: data.user.id,
    provider: "apple_health",
    token_hash: tokenHash,
    active: true,
    paired_at: new Date().toISOString(),
  }, { onConflict: "user_id,provider" });
  if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 });
  return NextResponse.json({ userId: data.user.id, syncToken: token, warning: "Store this token in the iOS Keychain. It is shown only once." });
}
