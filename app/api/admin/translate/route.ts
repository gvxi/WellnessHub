import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth/verify-admin";

// Unofficial Google Translate API — no key required, reasonable for admin use
async function googleTranslate(text: string, from: string, to: string): Promise<string> {
  if (!text.trim()) return "";
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`Translate failed: ${res.status}`);
  const data = await res.json();
  // data[0] is an array of [translated_chunk, original_chunk] pairs
  return (data[0] as [string, string][]).map((chunk) => chunk[0] ?? "").join("").trim();
}

export async function POST(request: NextRequest) {
  const ctx = await verifyAdmin(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { texts, from = "en", to = "ar" } = body as {
    texts: string[];
    from?: string;
    to?: string;
  };

  if (!Array.isArray(texts)) {
    return NextResponse.json({ error: "texts must be an array" }, { status: 400 });
  }

  try {
    const translations = await Promise.all(
      texts.map((t) => googleTranslate(t, from, to))
    );
    return NextResponse.json({ translations });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Translation failed" },
      { status: 502 }
    );
  }
}
