// Escape all user-controlled values before interpolation into HTML
function esc(s: string | undefined | null): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-email`;
  return fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ to, subject, html }),
  });
}

// ── Email templates ────────────────────────────────────────────────────────

const LOGO_URL = "https://vzmaeqwmktivsnazrfrw.supabase.co/storage/v1/object/public/Public-assets/Logo.png";

const RECEIPT_T = {
  en: {
    heading: "Booking Confirmed",
    subtitle: "Your booking has been confirmed. Here are your details:",
    hi: "Hi",
    colService: "Service",
    colQty: "Qty",
    colPrice: "Price",
    total: "Total",
    paymentMethod: "Payment method",
    bookingId: "Booking ID",
    footer: "Thank you for choosing WellnessHub",
    dir: "ltr", align: "left", alignEnd: "right",
  },
  ar: {
    heading: "تم تأكيد الحجز",
    subtitle: "تم تأكيد حجزك. إليك تفاصيلك:",
    hi: "مرحباً",
    colService: "الخدمة",
    colQty: "الكمية",
    colPrice: "السعر",
    total: "المجموع",
    paymentMethod: "طريقة الدفع",
    bookingId: "رقم الحجز",
    footer: "شكراً لاختيارك WellnessHub",
    dir: "rtl", align: "right", alignEnd: "left",
  },
} as const;

interface BookingReceiptData {
  bookingId: string;
  customerName: string;
  items: Array<{ name: string; tierLabel?: string; qty: number; price: string }>;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
  lang?: "en" | "ar";
}

export function posBookingReceiptHtml(data: BookingReceiptData): string {
  const t = RECEIPT_T[data.lang ?? "en"];
  const rows = data.items.map((i) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f0ebec;text-align:${t.align};">
        <span style="font-size:13px;font-weight:600;color:#0e0b0d;">${esc(i.name)}</span>
        ${i.tierLabel ? `<span style="font-size:11px;color:#8E6A94;margin-${t.align === "left" ? "left" : "right"}:6px;">(${esc(i.tierLabel)})</span>` : ""}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0ebec;text-align:center;color:#555;font-size:13px;">${i.qty}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0ebec;text-align:${t.alignEnd};font-weight:600;font-size:13px;color:#0e0b0d;">${esc(i.price)}</td>
    </tr>`).join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><title>WellnessHub</title></head>
<body style="margin:0;padding:0;background:#f2edee;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div dir="${t.dir}" style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(14,11,13,.08);">
    <div style="background:#5A0F1B;padding:28px 36px;text-align:center;">
      <img src="${LOGO_URL}" alt="WellnessHub" width="48" height="48" style="display:block;margin:0 auto 10px;border-radius:10px;"/>
      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">WellnessHub</h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,.6);font-size:12px;">wellnesshubom.com</p>
    </div>
    <div style="padding:32px 36px;">
      <h2 style="margin:0 0 6px;font-size:18px;font-weight:700;color:#5A0F1B;text-align:${t.align};">${t.heading}</h2>
      <p style="margin:0 0 4px;font-size:14px;color:#0e0b0d;text-align:${t.align};">${t.hi} <strong>${esc(data.customerName)}</strong>,</p>
      <p style="margin:0 0 24px;font-size:13px;color:#6b6063;text-align:${t.align};">${t.subtitle}</p>
      <table style="width:100%;border-collapse:collapse;font-size:13px;color:#0e0b0d;">
        <thead>
          <tr style="background:#f9f6f6;">
            <th style="padding:8px 12px;text-align:${t.align};font-weight:600;color:#8E6A94;font-size:11px;text-transform:uppercase;letter-spacing:.06em;">${t.colService}</th>
            <th style="padding:8px 12px;text-align:center;font-weight:600;color:#8E6A94;font-size:11px;text-transform:uppercase;letter-spacing:.06em;">${t.colQty}</th>
            <th style="padding:8px 12px;text-align:${t.alignEnd};font-weight:600;color:#8E6A94;font-size:11px;text-transform:uppercase;letter-spacing:.06em;">${t.colPrice}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:12px 12px 0;font-weight:700;font-size:14px;text-align:${t.align};">${t.total}</td>
            <td style="padding:12px 12px 0;text-align:${t.alignEnd};font-weight:700;font-size:14px;color:#5A0F1B;">${data.totalAmount.toFixed(2)} OMR</td>
          </tr>
        </tfoot>
      </table>
      <div style="margin-top:20px;padding:14px 16px;background:#f9f6f6;border-radius:10px;font-size:13px;color:#6b6063;">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <span>${t.paymentMethod}</span><strong style="color:#0e0b0d;">${esc(data.paymentMethod)}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span>${t.bookingId}</span><strong style="color:#0e0b0d;font-family:monospace;">${esc(data.bookingId.slice(0, 8).toUpperCase())}</strong>
        </div>
      </div>
    </div>
    <div style="padding:18px 36px;background:#f9f6f6;text-align:center;font-size:12px;color:#b0a5a7;">${t.footer}</div>
  </div>
</body>
</html>`;
}

interface SubNotificationData {
  bookingId: string;
  customerName: string;
  staffName: string;
  totalAmount: number;
  paymentMethod: string;
  itemCount: number;
}

export function posSubNotificationHtml(data: SubNotificationData): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><title>WellnessHub — New POS Booking</title></head>
<body style="margin:0;padding:0;background:#f2edee;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(14,11,13,.08);">
    <div style="background:#5A0F1B;padding:24px 32px;text-align:center;">
      <img src="${LOGO_URL}" alt="WellnessHub" width="40" height="40" style="display:block;margin:0 auto 8px;border-radius:8px;"/>
      <h1 style="margin:0;color:#fff;font-size:16px;font-weight:700;">WellnessHub · POS</h1>
    </div>
    <div style="padding:28px 32px;font-size:14px;color:#0e0b0d;">
      <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#5A0F1B;">New Booking</p>
      <p style="margin:0 0 20px;font-size:13px;color:#6b6063;">Created by staff member <strong>${esc(data.staffName)}</strong></p>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <tr><td style="padding:6px 0;color:#8E6A94;width:40%;">Customer</td><td style="padding:6px 0;font-weight:600;">${esc(data.customerName)}</td></tr>
        <tr><td style="padding:6px 0;color:#8E6A94;">Services</td><td style="padding:6px 0;">${data.itemCount}</td></tr>
        <tr><td style="padding:6px 0;color:#8E6A94;">Total</td><td style="padding:6px 0;font-weight:700;color:#5A0F1B;">${data.totalAmount.toFixed(2)} OMR</td></tr>
        <tr><td style="padding:6px 0;color:#8E6A94;">Payment</td><td style="padding:6px 0;">${esc(data.paymentMethod)}</td></tr>
        <tr><td style="padding:6px 0;color:#8E6A94;">Booking Ref</td><td style="padding:6px 0;font-family:monospace;font-size:12px;">${esc(data.bookingId.slice(0, 8).toUpperCase())}</td></tr>
      </table>
    </div>
    <div style="padding:16px 32px;background:#f9f6f6;text-align:center;font-size:11px;color:#b0a5a7;">WellnessHub · Muscat, Oman</div>
  </div>
</body>
</html>`;
}
