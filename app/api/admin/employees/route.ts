import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdmin } from "@/lib/auth/verify-admin";

const EDGE_URL = process.env.SUPABASE_EDGE_FUNCTION_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

function anonClient() {
  return createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
}

// GET /api/admin/employees
export async function GET(request: NextRequest) {
  const ctx = await verifyAdmin(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await anonClient().rpc("admin_list_employees", {
    p_business_id: ctx.businessId,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ employees: data ?? [] });
}

// POST /api/admin/employees
export async function POST(request: NextRequest) {
  const ctx = await verifyAdmin(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email, password, full_name } = await request.json();
  if (!email || !password || !full_name) {
    return NextResponse.json({ error: "email, password, full_name required" }, { status: 400 });
  }

  const token = request.cookies.get("admin-token")?.value!;
  const efRes = await fetch(`${EDGE_URL}/employee-admin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ email, password, full_name, business_id: ctx.businessId }),
  });

  const efData = await efRes.json();
  if (!efRes.ok) {
    return NextResponse.json({ error: efData.error ?? "Failed to create employee" }, { status: efRes.status });
  }

  return NextResponse.json({ user_id: efData.user_id }, { status: 201 });
}
