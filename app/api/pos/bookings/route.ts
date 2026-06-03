import { NextRequest, NextResponse } from "next/server";
import { verifyEmployee } from "@/lib/auth/verify-employee";
import { verifyActor } from "@/lib/auth/verify-actor";
import { verifyAdmin } from "@/lib/auth/verify-admin";
import { adminClient } from "@/lib/supabase/admin";
import { sendEmail, posBookingReceiptHtml, posSubNotificationHtml } from "@/lib/email/send";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const asAdmin = url.searchParams.get("as_admin") === "1";

  // as_admin=1 → admin auth only (admin POS page, same browser may also have pos-token)
  // default    → employee auth first, admin fallback
  const adm = asAdmin ? await verifyAdmin(request) : null;
  const emp = adm ? null : await verifyEmployee(request);
  const fallbackAdm = (!adm && !emp) ? await verifyAdmin(request) : null;
  const activeAdm = adm ?? fallbackAdm;

  if (!emp && !activeAdm) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = emp ? emp.businessId : activeAdm!.businessId;
  const userId     = emp ? emp.userId     : activeAdm!.userId;

  const supabase = adminClient();

  const { searchParams } = url;
  const status = searchParams.get("status");

  // Admin gets full access; employee is filtered by their permissions
  const delayMinutes   = emp ? emp.permissions.booking_delay_minutes  : 0;
  const showRejected   = emp ? emp.permissions.show_rejected_bookings  : true;
  const emailFilter    = emp ? emp.permissions.booking_filter_email    : null;
  const phoneFilter    = emp ? emp.permissions.booking_filter_phone    : null;

  let query = supabase
    .from("bookings")
    .select(`
      id, status, scheduled_at, notes, conflict_flag, created_at,
      customer_data, cart_items, total_amount,
      booking_by, created_by_user_id, payment_method,
      services ( name, translations ),
      packages ( name, translations ),
      payments ( transaction_id )
    `)
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  // Booking delay filter — employee only sees bookings older than N minutes
  if (delayMinutes > 0) {
    const cutoff = new Date(Date.now() - delayMinutes * 60 * 1000).toISOString();
    query = query.lte("created_at", cutoff);
  }

  // Status filter
  if (status && status !== "all") {
    query = query.eq("status", status);
  } else if (!showRejected) {
    query = query.neq("status", "rejected");
  }

  // Today + own bookings filter (for history panel)
  if (searchParams.get("today_mine") === "1") {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    query = query
      .eq("created_by_user_id", userId)
      .gte("created_at", todayStart.toISOString());
  } else {
    // Customer email/phone filter (not applied in today_mine mode)
    if (emailFilter) query = query.ilike("customer_data->>email", `%${emailFilter}%`);
    if (phoneFilter) query = query.ilike("customer_data->>phone", `%${phoneFilter}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rawBookings = (data ?? []).map((b: any) => ({
    id: b.id,
    status: b.status,
    scheduled_at: b.scheduled_at,
    notes: b.notes,
    conflict_flag: b.conflict_flag,
    created_at: b.created_at,
    customer_name: (b.customer_data as any)?.username ?? null,
    customer_email: (b.customer_data as any)?.email ?? null,
    customer_phone: (b.customer_data as any)?.phone ?? null,
    service_name: (b.services as any)?.name ?? null,
    service_translations: (b.services as any)?.translations ?? null,
    package_name: (b.packages as any)?.name ?? null,
    package_translations: (b.packages as any)?.translations ?? null,
    cart_items: b.cart_items ?? null,
    total_amount: b.total_amount ?? null,
    payment_reference: (b.payments as any)?.[0]?.transaction_id ?? null,
    booking_by: b.booking_by ?? "Customer",
    created_by_user_id: b.created_by_user_id ?? null,
    created_by_name: null as string | null,
    created_by_email: null as string | null,
    payment_method: b.payment_method ?? "Payment Gateway",
  }));

  // Resolve creator name + email from auth.users via admin API
  const creatorIds = [...new Set(rawBookings
    .filter(b => b.booking_by !== "Customer" && b.created_by_user_id)
    .map(b => b.created_by_user_id as string))];

  if (creatorIds.length > 0) {
    const { data: usersData } = await adminClient()
      .from("users")
      .select("id, full_name, email")
      .in("id", creatorIds);
    const creatorMap = Object.fromEntries(
      (usersData ?? []).map((u: any) => [u.id, { name: u.full_name ?? null, email: u.email ?? null }])
    );
    for (const b of rawBookings) {
      if (b.created_by_user_id && creatorMap[b.created_by_user_id]) {
        b.created_by_name = creatorMap[b.created_by_user_id].name;
        b.created_by_email = creatorMap[b.created_by_user_id].email;
      }
    }
  }

  return NextResponse.json(rawBookings);
}

// ── POST — create a POS booking after checkout flow ────────────────────────
export async function POST(request: NextRequest) {
  const ctx = await verifyActor(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const {
    otp_session_id,
    customer,
    items,
    payment_method,
    status,
    lang,
  } = body as {
    otp_session_id: string;
    customer: { name: string; email: string };
    items: Array<{
      name: string;
      name_ar?: string;
      price: string;
      numericPrice: number;
      tierLabel?: string;
      qty: number;
      categoryTitle: string;
    }>;
    payment_method: "Cash" | "POS Machine" | "QR/Transfer";
    status: "approved" | "rejected";
    lang?: string;
  };
  const resolvedLang: "en" | "ar" = lang === "ar" ? "ar" : "en";

  // Validate OTP session is verified
  const supabase = adminClient();

  const { data: session } = await supabase
    .from("pos_otp_sessions")
    .select("id, verified, expires_at, business_id")
    .eq("id", otp_session_id)
    .single();

  if (
    !session ||
    !session.verified ||
    session.business_id !== ctx.businessId ||
    new Date() > new Date(session.expires_at)
  ) {
    return NextResponse.json({ error: "Invalid or expired OTP session" }, { status: 422 });
  }

  // Build cart_items
  const cart_items = items.map((i) => ({
    name: i.name,
    ...(i.name_ar ? { name_ar: i.name_ar } : {}),
    qty: i.qty,
    line_total: i.numericPrice * i.qty,
    currency: "OMR",
  }));

  const total_amount = items.reduce((s, i) => s + i.numericPrice * i.qty, 0);

  // Insert booking
  const { data: booking, error: insertError } = await supabase
    .from("bookings")
    .insert({
      business_id: ctx.businessId,
      customer_id: null,
      scheduled_at: new Date().toISOString(),
      status,
      customer_data: { username: customer.name, email: customer.email },
      cart_items,
      total_amount,
      booking_by: ctx.isAdmin ? "Admin" : "POS",
      created_by_user_id: ctx.userId,
      payment_method,
    })
    .select("id")
    .single();

  if (insertError || !booking) {
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }

  // Delete used OTP session
  await supabase.from("pos_otp_sessions").delete().eq("id", otp_session_id);

  // Send emails only for approved bookings
  if (status === "approved") {
    const receiptHtml = posBookingReceiptHtml({
      bookingId: booking.id,
      customerName: customer.name,
      items: items.map((i) => ({
        name: i.name,
        nameAr: i.name_ar,
        tierLabel: i.tierLabel,
        tierLabelAr: (i as any).tierLabelAr,
        qty: i.qty,
        numericPrice: i.numericPrice,
      })),
      totalAmount: total_amount,
      paymentMethod: payment_method,
      createdAt: new Date().toISOString(),
      lang: resolvedLang,
    });

    // Customer receipt — awaited so Vercel doesn't kill the fetch before it completes
    await sendEmail({
      to: customer.email,
      subject: resolvedLang === "ar" ? "WellnessHub — تأكيد حجزك" : "WellnessHub — Booking Confirmation",
      html: receiptHtml,
    }).catch(() => {});

    // Sub-POS → notify main POS (not applicable for admin)
    if (!ctx.isAdmin && ctx.posUserType === "sub" && ctx.parentEmail) {
      const staffName = ctx.fullName ?? ctx.email;
      sendEmail({
        to: ctx.parentEmail,
        subject: `New POS Booking by ${staffName}`,
        html: posSubNotificationHtml({
          bookingId: booking.id,
          customerName: customer.name,
          staffName,
          totalAmount: total_amount,
          paymentMethod: payment_method,
          itemCount: items.reduce((s, i) => s + i.qty, 0),
        }),
      }).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true, booking_id: booking.id });
}
