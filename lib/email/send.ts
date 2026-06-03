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

// ── Shared ─────────────────────────────────────────────────────────────────

const LOGO_URL = "https://vzmaeqwmktivsnazrfrw.supabase.co/storage/v1/object/public/Public-assets/Logo.png";

const PAYMENT_METHOD_AR: Record<string, string> = {
  "Payment Gateway": "بوابة الدفع الإلكتروني",
  "Cash": "نقداً",
  "POS Machine": "جهاز نقطة البيع",
  "QR/Transfer": "QR / تحويل",
};

// Unicode checkmark in a circle — works in all email clients (no SVG)
const SUCCESS_ICON = `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 4px;">
    <tr>
      <td align="center">
        <div style="display:inline-block;width:60px;height:60px;line-height:60px;border-radius:50%;background:#F2EDEE;text-align:center;font-size:28px;color:#5A0F1B;font-weight:700;">&#10003;</div>
      </td>
    </tr>
  </table>`;

// Info row using table — flexbox unsupported in Outlook/Gmail
function infoRow(label: string, value: string, border: boolean): string {
  return `
    <tr>
      <td style="padding:10px 14px;font-size:12px;color:#888;font-weight:500;${border ? "border-bottom:1px solid #f0ebec;" : ""}">${label}</td>
      <td style="padding:10px 14px;font-size:12px;color:#0e0b0d;font-weight:700;text-align:right;${border ? "border-bottom:1px solid #f0ebec;" : ""}">${value}</td>
    </tr>`;
}

// ── POS Booking Receipt ─────────────────────────────────────────────────────

const RECEIPT_T = {
  en: {
    heading: "Booking Confirmed",
    subtitle: "Your booking is confirmed. Here are your details:",
    hi: "Hi",
    colService: "Service",
    colQty: "Qty",
    colPrice: "Price",
    total: "Total",
    paymentMethod: "Payment method",
    bookingId: "Booking ID",
    currency: "OMR",
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
    currency: "ر.ع.",
    footer: "شكراً لاختيارك WellnessHub",
    dir: "rtl", align: "right", alignEnd: "left",
  },
} as const;

interface BookingReceiptData {
  bookingId: string;
  customerName: string;
  items: Array<{
    name: string;
    nameAr?: string;
    tierLabel?: string;
    tierLabelAr?: string;
    qty: number;
    numericPrice: number;
  }>;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
  lang?: "en" | "ar";
}

export function posBookingReceiptHtml(data: BookingReceiptData): string {
  const lang = data.lang ?? "en";
  const t = RECEIPT_T[lang];
  const isAr = lang === "ar";
  const localizedPayment = isAr
    ? (PAYMENT_METHOD_AR[data.paymentMethod] ?? data.paymentMethod)
    : data.paymentMethod;

  const rows = data.items.map((i) => {
    const name = isAr && i.nameAr ? i.nameAr : i.name;
    const tier = isAr && i.tierLabelAr ? i.tierLabelAr : i.tierLabel;
    const price = `${i.numericPrice.toFixed(3)} ${t.currency}`;
    return `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f5f1f2;text-align:${t.align};">
          <span style="font-size:13px;font-weight:600;color:#0e0b0d;">${esc(name)}</span>
          ${tier ? `<br/><span style="font-size:11px;color:#8E6A94;">${esc(tier)}</span>` : ""}
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #f5f1f2;text-align:center;color:#666;font-size:13px;">${i.qty}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f5f1f2;text-align:${t.alignEnd};font-weight:600;font-size:13px;color:#0e0b0d;">${price}</td>
      </tr>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="utf-8"/><title>WellnessHub</title></head>
<body style="margin:0;padding:0;background:#f2edee;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2edee;">
    <tr><td align="center" style="padding:40px 16px;">

      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(14,11,13,.08);">

        <!-- Header -->
        <tr>
          <td style="background:#5A0F1B;padding:28px 36px;text-align:center;">
            <img src="${LOGO_URL}" alt="WellnessHub" width="48" height="48" style="display:block;margin:0 auto 10px;border-radius:10px;"/>
            <p style="margin:0;color:#fff;font-size:20px;font-weight:700;">WellnessHub</p>
            <p style="margin:4px 0 0;color:rgba(255,255,255,.55);font-size:12px;">wellnesshubom.com</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:0 36px 32px;" dir="${t.dir}">

            ${SUCCESS_ICON}

            <h2 style="margin:12px 0 6px;font-size:18px;font-weight:700;color:#5A0F1B;text-align:${t.align};">${t.heading}</h2>
            <p style="margin:0 0 4px;font-size:14px;color:#0e0b0d;text-align:${t.align};">${t.hi} <strong>${esc(data.customerName)}</strong>,</p>
            <p style="margin:0 0 24px;font-size:13px;color:#777;text-align:${t.align};">${t.subtitle}</p>

            <!-- Items table -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;">
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
                  <td style="padding:12px 12px 0;text-align:${t.alignEnd};font-weight:700;font-size:14px;color:#5A0F1B;">${data.totalAmount.toFixed(3)} ${t.currency}</td>
                </tr>
              </tfoot>
            </table>

            <!-- Info rows -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;border:1px solid #f0ebec;border-radius:10px;border-collapse:separate;border-spacing:0;overflow:hidden;">
              ${infoRow(t.paymentMethod, esc(localizedPayment), true)}
              ${infoRow(t.bookingId, `<span style="font-family:monospace;">${esc(data.bookingId.slice(0, 8).toUpperCase())}</span>`, false)}
            </table>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:18px 36px;background:#f9f6f6;text-align:center;font-size:12px;color:#b0a5a7;">${t.footer}</td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── POS Sub-user Notification ───────────────────────────────────────────────

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
<head><meta charset="utf-8"/><title>WellnessHub POS</title></head>
<body style="margin:0;padding:0;background:#f2edee;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2edee;">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(14,11,13,.08);">
        <tr>
          <td style="background:#5A0F1B;padding:24px 32px;text-align:center;">
            <img src="${LOGO_URL}" alt="WellnessHub" width="40" height="40" style="display:block;margin:0 auto 8px;border-radius:8px;"/>
            <p style="margin:0;color:#fff;font-size:16px;font-weight:700;">WellnessHub &middot; POS</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#5A0F1B;">New Booking</p>
            <p style="margin:0 0 20px;font-size:13px;color:#777;">Created by <strong>${esc(data.staffName)}</strong></p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;">
              ${infoRow("Customer", esc(data.customerName), true)}
              ${infoRow("Services", String(data.itemCount), true)}
              ${infoRow("Total", `${data.totalAmount.toFixed(3)} OMR`, true)}
              ${infoRow("Payment", esc(data.paymentMethod), true)}
              ${infoRow("Booking Ref", `<span style="font-family:monospace;">${esc(data.bookingId.slice(0, 8).toUpperCase())}</span>`, false)}
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;background:#f9f6f6;text-align:center;font-size:11px;color:#b0a5a7;">WellnessHub &middot; Muscat, Oman</td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
