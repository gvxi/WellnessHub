import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export type AdminContext = {
  userId: string;
  businessId: string;
};

export async function verifyAdmin(request: NextRequest): Promise<AdminContext | null> {
  const token = request.cookies.get("admin-token")?.value;
  const businessId = request.cookies.get("admin-biz")?.value;

  if (!token || !businessId) return null;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // setSession ensures RLS queries use the user JWT rather than anon key
  await supabase.auth.setSession({ access_token: token, refresh_token: "" });

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: userRow } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userRow?.role !== "admin") return null;

  return { userId: user.id, businessId };
}

export function createAuthedClient(token: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
