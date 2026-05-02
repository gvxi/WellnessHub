import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin, createAuthedClient } from "@/lib/auth/verify-admin";
import { createClient } from "@supabase/supabase-js";

function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

type CartItem = {
  name: string;
  name_ar?: string;
  qty: number;
  line_total: number;
  currency: string;
};

type Lang = "en" | "ar";

const EMAIL_T = {
  en: {
    subject: "WellnessHub — Booking Approved",
    heading: "Booking Approved",
    subtitle: "Your booking has been approved. We look forward to seeing you!",
    colService: "Service",
    colQty: "Qty",
    colPrice: "Price",
    total: "Total",
    bookingId: "Booking ID",
    dir: "ltr",
    align: "left",
    alignEnd: "right",
  },
  ar: {
    subject: "WellnessHub — تم قبول الحجز",
    heading: "تم قبول الحجز",
    subtitle: "تم قبول حجزك. نتطلع إلى رؤيتك!",
    colService: "الخدمة",
    colQty: "الكمية",
    colPrice: "السعر",
    total: "المجموع",
    bookingId: "رقم الحجز",
    dir: "rtl",
    align: "right",
    alignEnd: "left",
  },
} as const;

function buildApprovalInvoiceHtml(
  booking: { id: string; cart_items: CartItem[]; total_amount: number },
  lang: Lang
) {
  const t = EMAIL_T[lang];
  const isAr = lang === "ar";

  const rows = (booking.cart_items ?? [])
    .map((i) => {
      const itemName = isAr && i.name_ar ? i.name_ar : i.name;
      return `<tr>
        <td style="padding:8px 12px;color:#222;border-bottom:1px solid #eee;text-align:${t.align}">${itemName}</td>
        <td style="padding:8px 12px;color:#555;border-bottom:1px solid #eee;text-align:center">${i.qty}</td>
        <td style="padding:8px 12px;color:#222;border-bottom:1px solid #eee;text-align:${t.alignEnd};font-weight:600">${i.line_total} OMR</td>
      </tr>`;
    })
    .join("");

  return `
    <div dir="${t.dir}" style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#0E0B0D;direction:${t.dir}">
      <h1 style="color:#5A0F1B;font-size:22px;margin-bottom:4px;text-align:${t.align}">WellnessHub</h1>
      <p style="color:#888;font-size:12px;margin-bottom:28px;text-align:${t.align}">Muscat, Oman</p>
      <h2 style="font-size:18px;margin-bottom:4px;text-align:${t.align}">${t.heading}</h2>
      <p style="color:#888;font-size:12px;margin-bottom:24px;text-align:${t.align}">${t.subtitle}</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
        <thead>
          <tr style="background:#F2EDEE">
            <th style="padding:10px 12px;text-align:${t.align};font-size:11px;color:#888;text-transform:uppercase">${t.colService}</th>
            <th style="padding:10px 12px;text-align:center;font-size:11px;color:#888;text-transform:uppercase">${t.colQty}</th>
            <th style="padding:10px 12px;text-align:${t.alignEnd};font-size:11px;color:#888;text-transform:uppercase">${t.colPrice}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="display:flex;justify-content:space-between;padding:12px;background:#F2EDEE;border-radius:8px;margin-bottom:24px">
        <span style="font-weight:700">${t.total}</span>
        <span style="font-weight:700;color:#5A0F1B">${booking.total_amount} OMR</span>
      </div>
      <p style="font-size:11px;color:#aaa;text-align:${t.align}">${t.bookingId}: ${booking.id}</p>
    </div>
  `;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await verifyAdmin(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { status } = await request.json();

  const allowed = ["approved", "rejected", "refunded"];
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const token = request.cookies.get("admin-token")!.value;
  const supabase = createAuthedClient(token);

  // Fetch booking data before update (needed for invoice + alert body)
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, cart_items, total_amount, customer_data")
    .eq("id", id)
    .eq("business_id", ctx.businessId)
    .single();

  const { error } = await supabase
    .from("bookings")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("business_id", ctx.businessId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const customerData = (booking as any)?.customer_data as Record<string, string> | null;
  const customerName = customerData?.username ?? null;

  // Insert admin alert for status change (fire-and-forget)
  anonClient().rpc("admin_insert_alert", {
    p_business_id: ctx.businessId,
    p_type: `booking_${status}`,
    p_title:
      status === "approved"
        ? "Booking Approved"
        : status === "rejected"
        ? "Booking Rejected"
        : "Booking Refunded",
    p_body: customerName
      ? `${customerName}'s booking has been ${status}.`
      : `A booking has been ${status}.`,
    p_metadata: { booking_id: id, customer_name: customerName },
  }).then(null, () => {});

  // Send approval invoice email (fire-and-forget)
  if (status === "approved" && booking) {
    const email = customerData?.email;
    const resendKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;

    if (email && resendKey && fromEmail) {
      // Fetch customer's preferred language
      const userId = customerData?.user_id;
      let lang: Lang = "en";
      if (userId) {
        const { data: fetchedLang } = await anonClient().rpc("get_user_language", {
          p_user_id: userId,
        });
        if (fetchedLang === "ar") lang = "ar";
      }

      const html = buildApprovalInvoiceHtml(
        {
          id: (booking as any).id,
          cart_items: (booking as any).cart_items ?? [],
          total_amount: Number((booking as any).total_amount ?? 0),
        },
        lang
      );

      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: `WellnessHub <${fromEmail}>`,
          to: [email],
          subject: EMAIL_T[lang].subject,
          html,
        }),
      }).catch((err) => console.error("Invoice send failed:", err));
    }
  }

  return NextResponse.json({ ok: true });
}
