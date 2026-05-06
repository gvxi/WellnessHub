import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin, createAuthedClient } from "@/lib/auth/verify-admin";

// Deletes pending bookings older than 1 day.
// Called manually from admin ActionsPanel or via cron (set CRON_SECRET in env).
export async function POST(request: NextRequest) {
  // Allow cron trigger via secret header (e.g. Vercel Cron)
  const cronSecret = request.headers.get("x-cron-secret");
  const isAuthedCron = cronSecret && cronSecret === process.env.CRON_SECRET;

  if (!isAuthedCron) {
    const ctx = await verifyAdmin(request);
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = request.cookies.get("admin-token")?.value;
  if (!token && !isAuthedCron) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use service role for cron path, authed client for admin path
  let supabase: ReturnType<typeof createAuthedClient>;
  if (isAuthedCron) {
    const { createClient } = await import("@supabase/supabase-js");
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    ) as unknown as ReturnType<typeof createAuthedClient>;
  } else {
    supabase = createAuthedClient(token!);
  }

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("bookings")
    .delete()
    .eq("status", "pending")
    .lt("created_at", cutoff)
    .select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ cleared: data?.length ?? 0 });
}
