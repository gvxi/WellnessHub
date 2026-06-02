import { NextResponse } from "next/server";
import { fetchCatalog } from "@/lib/supabase/catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  const categories = await fetchCatalog();
  return NextResponse.json(categories);
}
