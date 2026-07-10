import type { Config } from "@netlify/functions";

const handler = async () => {
  const baseUrl = process.env.URL;
  const secret = process.env.MODEL_CRON_SECRET;
  if (!baseUrl || !secret) return new Response("Missing URL or MODEL_CRON_SECRET", { status: 500 });
  const response = await fetch(`${baseUrl}/api/model/recalculate-all`, {
    method: "POST",
    headers: { "x-model-cron-secret": secret },
  });
  return new Response(await response.text(), { status: response.status, headers: { "content-type": "application/json" } });
};

export default handler;

export const config: Config = { schedule: "0 3 * * *" };
