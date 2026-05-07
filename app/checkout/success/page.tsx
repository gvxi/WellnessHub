"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useLang } from "@/lib/lang-context";
import { useCart } from "@/lib/shop-context";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

function SuccessContent() {
  const params = useSearchParams();
  const orderId = params.get("order_id") ?? params.get("id");
  const bookingId = params.get("booking_id");
  const { t, lang } = useLang();
  const { clearCart } = useCart();

  const [invoiceState, setInvoiceState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [sendCount, setSendCount] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const autoSentRef = useRef(false);

  useEffect(() => {
    clearCart();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  // Auto-send invoice once on mount
  useEffect(() => {
    if (!bookingId || autoSentRef.current) return;
    autoSentRef.current = true;
    sendInvoice(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  async function getToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }

  async function sendInvoice(silent = false) {
    if (!bookingId) return;
    if (!silent && (sendCount >= 3 || cooldown > 0)) return;
    if (!silent) setInvoiceState("sending");

    try {
      const token = await getToken();
      if (!token) {
        if (!silent) setInvoiceState("error");
        return;
      }

      const res = await fetch("/api/checkout/send-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ booking_id: bookingId, lang }),
      });
      const data = await res.json();

      if (res.status === 429 && data.error === "cooldown") {
        setCooldown(data.retry_in ?? 30);
        if (!silent) setInvoiceState("idle");
        return;
      }

      if (res.status === 429 && data.error === "limit_reached") {
        setSendCount(3);
        if (!silent) setInvoiceState("idle");
        return;
      }

      if (res.ok) {
        const newCount = data.sent_count ?? sendCount + 1;
        setSendCount(newCount);
        setCooldown(30);
        if (!silent) {
          setInvoiceState("sent");
          setTimeout(() => setInvoiceState("idle"), 3000);
        }
      } else {
        if (!silent) {
          setInvoiceState("error");
          setTimeout(() => setInvoiceState("idle"), 3000);
        }
      }
    } catch {
      if (!silent) {
        setInvoiceState("error");
        setTimeout(() => setInvoiceState("idle"), 3000);
      }
    }
  }

  const canSend = !!bookingId && sendCount < 3 && cooldown === 0 && invoiceState === "idle";
  const remaining = 3 - sendCount;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md mx-auto text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 mb-6">
          <CheckCircle2 size={40} className="text-emerald-500" strokeWidth={1.5} />
        </div>

        <h1 className="text-2xl font-bold text-dark mb-3">{t("checkout.successTitle")}</h1>
        <p className="text-sm text-dark/55 leading-relaxed mb-6">{t("checkout.successBody")}</p>

        {orderId && (
          <p className="text-xs text-dark/35 mb-4 font-mono">
            {t("checkout.orderId")} #{orderId}
          </p>
        )}

        {/* Invoice resend button */}
        {bookingId && (
          <div className="mb-6">
            {sendCount >= 3 ? (
              <p className="text-xs text-dark/35">{t("checkout.invoiceLimit")}</p>
            ) : (
              <button
                onClick={() => sendInvoice(false)}
                disabled={!canSend}
                className={cn(
                  "inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold transition-colors",
                  canSend
                    ? "bg-dark/6 text-dark hover:bg-dark/10"
                    : "bg-dark/4 text-dark/30 cursor-not-allowed"
                )}
              >
                {invoiceState === "sending" ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Mail size={14} />
                )}
                {invoiceState === "sending"
                  ? t("checkout.invoiceSending")
                  : invoiceState === "sent"
                  ? t("checkout.invoiceSent")
                  : invoiceState === "error"
                  ? t("checkout.failedBody")
                  : cooldown > 0
                  ? t("checkout.invoiceCooldown").replace("{s}", String(cooldown))
                  : sendCount === 0
                  ? t("checkout.sendInvoice")
                  : `${t("checkout.resendInvoice")} (${remaining} left)`}
              </button>
            )}
          </div>
        )}

        <Link
          href="/"
          className="inline-block px-8 py-3.5 rounded-2xl bg-primary text-light text-sm font-semibold
                     hover:bg-primary/90 transition-colors"
        >
          {t("checkout.backHome")}
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 size={28} className="text-dark/20 animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
