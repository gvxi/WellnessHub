import { NextRequest, NextResponse } from "next/server";
import { verifyEmployee } from "@/lib/auth/verify-employee";
import { verifyActor } from "@/lib/auth/verify-actor";
import { createAuthedClient } from "@/lib/auth/verify-admin";
import { adminClient } from "@/lib/supabase/admin";
import { sendEmail, posBookingReceiptHtml, posSubNotificationHtml } from "@/lib/email/send";

export async function GET(request: NextRequest) {
  const ctx = await verifyEmployee(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const token = request.cookies.get("pos-token")!.value;
  const supabase = createAuthedClient(token);

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
    .eq("business_id", ctx.businessId)
    .order("created_at", { ascending: false });

  // Booking delay filter — employee only sees bookings older than N minutes
  if (ctx.permissions.booking_delay_minutes > 0) {
    const cutoff = new Date(
      Date.now() - ctx.permissions.booking_delay_minutes * 60 * 1000
    ).toISOString();
    query = query.lte("created_at", cutoff);
  }

  // Status filter
  if (status && status !== "all") {
    query = query.eq("status", status);
  } else if (!ctx.permissions.show_rejected_bookings) {
    query = query.neq("status", "rejected");
  }

  // Customer email/phone filter
  const emailFilter = ctx.permissions.booking_filter_email;
  const phoneFilter = ctx.permissions.booking_filter_phone;
  if (emailFilter) {
    query = query.ilike("customer_data->>email", `%${emailFilter}%`);
  }
  if (phoneFilter) {
    query = query.ilike("customer_data->>phone", `%${phoneFilter}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const bookings = (data ?? []).map((b: any) => ({
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
    created_by_name: null, // resolved below if needed
    payment_method: b.payment_method ?? "Payment Gateway",
  }));

  return NextResponse.json(bookings);
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
        tierLabel: i.tierLabel,
        qty: i.qty,
        price: i.price,
      })),
      totalAmount: total_amount,
      paymentMethod: payment_method,
      createdAt: new Date().toISOString(),
      lang: resolvedLang,
    });

    // Customer receipt (fire-and-forget)
    sendEmail({
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
