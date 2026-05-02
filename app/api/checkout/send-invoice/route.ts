import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const edgeUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-invoice`;
  const body = await request.text();

  const res = await fetch(edgeUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body,
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("send-invoice edge function error:", data);
    return NextResponse.json(
      { error: data.error ?? "Failed to send invoice", detail: data.detail },
      { status: res.status }
    );
  }

  return NextResponse.json({ ok: true, sent_count: data.sent_count });
}
