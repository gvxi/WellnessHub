import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export type AdminContext = {
  userId: string;
  businessId: string;
};

// Anon client for SECURITY DEFINER RPCs (no RLS, no JWT threading)
function anonClient() {
  return createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
}

export async function verifyAdmin(request: NextRequest): Promise<AdminContext | null> {
  const token = request.cookies.get("admin-token")?.value;
  const businessId = request.cookies.get("admin-biz")?.value;

  if (!token || !businessId) return null;

  // Validate JWT via auth endpoint (Authorization header works fine for auth calls)
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  // SECURITY DEFINER RPC — bypasses RLS
  const { data: ctx } = await anonClient().rpc("get_admin_context", { uid: user.id });
  if (!ctx || ctx.length === 0 || ctx[0].role !== "admin") return null;

  return { userId: user.id, businessId };
}

export function createAuthedClient(token: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
