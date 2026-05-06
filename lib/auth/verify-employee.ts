import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import type { EmployeePermissions } from "@/lib/supabase/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export type EmployeeContext = {
  userId: string;
  businessId: string;
  permissions: EmployeePermissions;
};

function anonClient() {
  return createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
}

async function verifyFromParts(
  token: string | undefined,
  businessId: string | undefined,
  sessionToken: string | undefined
): Promise<EmployeeContext | null> {
  if (!token || !businessId || !sessionToken) return null;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: ctx } = await anonClient().rpc("get_employee_context", { uid: user.id });
  if (!ctx || ctx.length === 0) return null;

  const row = ctx[0];

  if (!row.is_active) return null;
  if (row.current_session_token !== sessionToken) return null;

  return {
    userId: user.id,
    businessId,
    permissions: {
      can_edit_services: row.can_edit_services,
      can_edit_ads: row.can_edit_ads,
      show_rejected_bookings: row.show_rejected_bookings,
      booking_delay_minutes: row.booking_delay_minutes,
      booking_filter_email: row.booking_filter_email,
      booking_filter_phone: row.booking_filter_phone,
      is_active: row.is_active,
      can_manage_bookings: row.can_manage_bookings ?? false,
    },
  };
}

export async function verifyEmployee(request: NextRequest): Promise<EmployeeContext | null> {
  return verifyFromParts(
    request.cookies.get("pos-token")?.value,
    request.cookies.get("pos-biz")?.value,
    request.cookies.get("pos-session")?.value
  );
}

export async function verifyEmployeeFromCookies(
  cookieStore: ReadonlyRequestCookies
): Promise<EmployeeContext | null> {
  return verifyFromParts(
    cookieStore.get("pos-token")?.value,
    cookieStore.get("pos-biz")?.value,
    cookieStore.get("pos-session")?.value
  );
}
