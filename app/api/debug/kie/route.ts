import { NextResponse } from "next/server";

// GET /api/debug/kie?taskId=xxx
// Returns raw kie.ai recordInfo response — use this to inspect what the API actually returns
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get("taskId");

  if (!taskId) {
    return NextResponse.json({ error: "taskId query param required" }, { status: 400 });
  }

  const key = process.env.KIE_API_KEY;
  if (!key) return NextResponse.json({ error: "KIE_API_KEY not set" }, { status: 500 });

  const res = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
    headers: { Authorization: `Bearer ${key}` },
  });

  const raw = await res.text();
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { parsed = raw; }

  return NextResponse.json({ status: res.status, body: parsed });
}
