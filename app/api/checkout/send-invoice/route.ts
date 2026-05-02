import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function makeAuthedClient(token: string) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

function anonClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
}

type CartItemJson = {
  name: string;
  name_ar?: string;
  qty: number;
  unit_price: number;
  line_total: number;
  currency: string;
};

type Lang = "en" | "ar";

const EMAIL_T = {
  en: {
    subject: "WellnessHub — Booking Confirmation",
    heading: "Booking Confirmed",
    subtitle: "Your booking is pending approval. We'll notify you once confirmed.",
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
    subject: "WellnessHub — تأكيد الحجز",
    heading: "تأكيد الحجز",
    subtitle: "حجزك قيد المراجعة. سنخطرك عند التأكيد.",
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

function buildInvoiceHtml(
  booking: { id: string; cart_items: CartItemJson[]; total_amount: number },
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

export async function POST(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = makeAuthedClient(token);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { booking_id } = (await request.json()) as { booking_id: string };

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, customer_id, cart_items, total_amount, invoice_sent_count, invoice_last_sent_at, status")
    .eq("id", booking_id)
    .single();

  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (booking.customer_id !== user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sentCount: number = booking.invoice_sent_count ?? 0;
  if (sentCount >= 3) {
    return NextResponse.json({ error: "limit_reached" }, { status: 429 });
  }

  if (booking.invoice_last_sent_at) {
    const elapsed = Date.now() - new Date(booking.invoice_last_sent_at).getTime();
    if (elapsed < 30_000) {
      const retryIn = Math.ceil((30_000 - elapsed) / 1000);
      return NextResponse.json({ error: "cooldown", retry_in: retryIn }, { status: 429 });
    }
  }

  // Fetch customer's preferred language
  let lang: Lang = "en";
  const { data: fetchedLang } = await anonClient().rpc("get_user_language", {
    p_user_id: user.id,
  });
  if (fetchedLang === "ar") lang = "ar";

  const items: CartItemJson[] = booking.cart_items ?? [];
  const html = buildInvoiceHtml(
    {
      id: booking.id,
      cart_items: items,
      total_amount: Number(booking.total_amount ?? 0),
    },
    lang
  );

  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!resendKey || !fromEmail) {
    console.warn("RESEND_API_KEY or RESEND_FROM_EMAIL not set — invoice not sent");
  } else {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: `WellnessHub <${fromEmail}>`,
        to: [user.email],
        subject: EMAIL_T[lang].subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("Resend invoice error:", err);
      return NextResponse.json({ error: "Failed to send invoice" }, { status: 502 });
    }
  }

  const newCount = sentCount + 1;
  await supabase
    .from("bookings")
    .update({ invoice_sent_count: newCount, invoice_last_sent_at: new Date().toISOString() })
    .eq("id", booking.id);

  return NextResponse.json({ ok: true, sent_count: newCount });
}
