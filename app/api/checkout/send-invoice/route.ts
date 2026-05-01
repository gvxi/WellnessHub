import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function makeAuthedClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

type CartItemJson = {
  name: string;
  qty: number;
  unit_price: number;
  line_total: number;
  currency: string;
};

export async function POST(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = makeAuthedClient(token);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { booking_id } = await request.json() as { booking_id: string };

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, customer_id, cart_items, total_amount, invoice_sent_count, invoice_last_sent_at, status")
    .eq("id", booking_id)
    .single();

  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (booking.customer_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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

  const items: CartItemJson[] = booking.cart_items ?? [];
  const rows = items
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px 12px;color:#222;border-bottom:1px solid #eee">${i.name}</td>
          <td style="padding:8px 12px;color:#555;border-bottom:1px solid #eee;text-align:center">${i.qty}</td>
          <td style="padding:8px 12px;color:#222;border-bottom:1px solid #eee;text-align:right;font-weight:600">${i.line_total} OMR</td>
        </tr>`
    )
    .join("");

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#0E0B0D">
      <h1 style="color:#5A0F1B;font-size:22px;margin-bottom:4px">WellnessHub</h1>
      <p style="color:#888;font-size:12px;margin-bottom:28px">Muscat, Oman</p>

      <h2 style="font-size:18px;margin-bottom:4px">Booking Confirmed</h2>
      <p style="color:#888;font-size:12px;margin-bottom:24px">
        Your booking is pending approval. We'll notify you once confirmed.
      </p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
        <thead>
          <tr style="background:#F2EDEE">
            <th style="padding:10px 12px;text-align:left;font-size:11px;color:#888;text-transform:uppercase">Service</th>
            <th style="padding:10px 12px;text-align:center;font-size:11px;color:#888;text-transform:uppercase">Qty</th>
            <th style="padding:10px 12px;text-align:right;font-size:11px;color:#888;text-transform:uppercase">Price</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div style="display:flex;justify-content:space-between;padding:12px;background:#F2EDEE;border-radius:8px;margin-bottom:24px">
        <span style="font-weight:700">Total</span>
        <span style="font-weight:700;color:#5A0F1B">${booking.total_amount} OMR</span>
      </div>

      <p style="font-size:11px;color:#aaa">
        Booking ID: ${booking.id}
      </p>
    </div>
  `;

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.warn("RESEND_API_KEY not set — invoice not sent");
  } else {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "WellnessHub <noreply@welln.lol>",
        to: [user.email],
        subject: `WellnessHub — Booking Confirmation`,
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
