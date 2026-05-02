"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, CreditCard, Lock, Loader2, ShoppingBag,
  Minus, Plus, Trash2, UserCircle, AlertCircle,
  Mail, CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/lib/shop-context";
import { useUI } from "@/lib/shop-context";
import { useLang } from "@/lib/lang-context";
import { useToast } from "@/lib/toast-context";
import { supabase } from "@/lib/supabase/client";
import { cn, resolveImage } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";

type AuthState = "loading" | "unauthenticated" | "incomplete-profile" | "ready";
type OtpState = "idle" | "sending" | "pending" | "verifying" | "verified";

export default function CheckoutPage() {
  const { items, totalCount, removeItem, updateQty, clearCart } = useCart();
  const { setAuthOpen, setAuthStep } = useUI();
  const { t, lang } = useLang();
  const { showToast } = useToast();
  const router = useRouter();
  const isAr = lang === "ar";

  const [authState, setAuthState] = useState<AuthState>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [payLoading, setPayLoading] = useState(false);

  const [otpState, setOtpState] = useState<OtpState>("idle");
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const otpVerifiedThisSession = useRef(false);

  const [unavailableIds, setUnavailableIds] = useState<Set<string>>(new Set());
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const subtotal = items.reduce(
    (sum, item) => sum + (item.snapshot.numericPrice ?? 0) * item.qty,
    0
  );

  const otpRequired = subtotal > 20 && !otpVerifiedThisSession.current;
  const hasUnavailableItems = items.some((i) => {
    const base = i.id.includes("::") ? i.id.split("::")[0] : i.id;
    return unavailableIds.has(base);
  });

  // ── Availability check ────────────────────────────────────────────────────
  useEffect(() => {
    if (items.length === 0) return;
    const baseIds = [...new Set(items.map((i) => i.id.includes("::") ? i.id.split("::")[0] : i.id))];
    supabase
      .from("services")
      .select("id, is_active")
      .in("id", baseIds)
      .then(({ data }) => {
        if (data) {
          setUnavailableIds(new Set(data.filter((s) => s.is_active === false).map((s) => s.id)));
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  // ── Auth + profile check ───────────────────────────────────────────────────
  async function checkAuth(u: User | null): Promise<AuthState> {
    if (!u) {
      setAuthState("unauthenticated");
      return "unauthenticated";
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, phone")
      .eq("id", u.id)
      .single();
    const state: AuthState = (!profile?.username || !profile?.phone)
      ? "incomplete-profile"
      : "ready";
    setAuthState(state);
    return state;
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u);
      checkAuth(u);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      checkAuth(u).then((state) => {
        if (event === "SIGNED_IN" && state === "incomplete-profile") {
          setTimeout(() => { setAuthStep("profile"); setAuthOpen(true); }, 300);
        }
      });
    });
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (totalCount === 0 && authState !== "loading" && !iframeUrl) {
      const timer = setTimeout(() => router.push("/"), 2000);
      return () => clearTimeout(timer);
    }
  }, [totalCount, authState, router, iframeUrl]);

  // ── OTP helpers ────────────────────────────────────────────────────────────
  async function getToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }

  async function sendOtp() {
    const token = await getToken();
    if (!token) { setAuthState("unauthenticated"); return; }
    setOtpState("sending");
    setOtpError("");
    try {
      const res = await fetch("/api/checkout/send-otp", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (res.ok) {
        setOtpState("pending");
      } else {
        showToast(t("checkout.failedBody"), "cart");
        setOtpState("idle");
      }
    } catch {
      showToast(t("checkout.failedBody"), "cart");
      setOtpState("idle");
    }
  }

  async function verifyOtp() {
    const token = await getToken();
    if (!token) return;
    setOtpState("verifying");
    setOtpError("");
    try {
      const res = await fetch("/api/checkout/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ code: otpCode }),
      });
      if (res.ok) {
        otpVerifiedThisSession.current = true;
        setOtpState("verified");
        handlePaymob(true);
      } else {
        setOtpError(t("checkout.otpInvalid"));
        setOtpState("pending");
      }
    } catch {
      setOtpError(t("checkout.otpInvalid"));
      setOtpState("pending");
    }
  }

  // ── Paymob initiate ────────────────────────────────────────────────────────
  async function handlePaymob(skipOtpCheck = false) {
    if (authState !== "ready") return;

    if (!skipOtpCheck && otpRequired && otpState !== "verified") {
      await sendOtp();
      return;
    }

    setPayLoading(true);
    try {
      const token = await getToken();
      if (!token) { setAuthState("unauthenticated"); return; }

      const res = await fetch("/api/checkout/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: items.map((i) => ({
            id: i.id,
            qty: i.qty,
            snapshot: {
              name: i.snapshot.name,
              nameAr: i.snapshot.nameAr,
              groupLabel: i.snapshot.groupLabel,
              numericPrice: i.snapshot.numericPrice,
            },
          })),
          subtotal,
        }),
      });

      const data = await res.json();

      if (data.error === "incomplete_profile") {
        setAuthState("incomplete-profile");
        return;
      }

      if (data.booking_id) {
        // External payment gateway (Paymob) — embed as iframe; clear cart after payment succeeds
        if (data.payment_url && !data.payment_url.startsWith("/")) {
          setIframeLoaded(false);
          setIframeUrl(data.payment_url);
          return;
        }

        // DEV_MODE / non-payment path — clear cart and confirm immediately
        fetch("/api/checkout/send-invoice", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ booking_id: data.booking_id, lang }),
        }).catch(() => {});
        clearCart();
        showToast(t("checkout.bookingConfirmed"), "cart");
        return;
      }

      showToast(t("checkout.comingSoon"), "cart");
    } catch {
      showToast(t("checkout.failedBody"), "cart");
    } finally {
      setPayLoading(false);
    }
  }

  // ── Empty cart ─────────────────────────────────────────────────────────────
  if (totalCount === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-dark/5 flex items-center justify-center">
          <ShoppingBag size={28} className="text-dark/20" />
        </div>
        <p className="text-sm font-medium text-dark/40">{t("checkout.emptyCart")}</p>
        <p className="text-xs text-dark/30">{t("checkout.emptyCartHint")}</p>
        <a href="/" className="text-xs text-primary hover:underline mt-2">
          {t("checkout.backToServices")}
        </a>
      </div>
    );
  }

  // ── Auth gate ──────────────────────────────────────────────────────────────
  if (authState === "loading") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 size={28} className="text-dark/20 animate-spin" />
      </div>
    );
  }

  if (authState === "unauthenticated") {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-5 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-dark/5 flex items-center justify-center">
          <UserCircle size={32} className="text-dark/25" />
        </div>
        <div>
          <p className="text-base font-semibold text-dark mb-1">{t("checkout.signInRequired")}</p>
          <p className="text-sm text-dark/45">{t("checkout.signInHint")}</p>
        </div>
        <button
          onClick={() => { setAuthStep("signin"); setAuthOpen(true); }}
          className="px-8 py-3.5 rounded-2xl bg-primary text-light text-sm font-semibold
                     hover:bg-primary/90 transition-colors"
        >
          {t("nav.signIn")}
        </button>
      </div>
    );
  }

  if (authState === "incomplete-profile") {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-5 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
          <AlertCircle size={30} className="text-secondary" />
        </div>
        <div>
          <p className="text-base font-semibold text-dark mb-1">{t("checkout.profileRequired")}</p>
          <p className="text-sm text-dark/45">{t("checkout.profileHint")}</p>
        </div>
        <button
          onClick={() => { setAuthStep("profile"); setAuthOpen(true); }}
          className="px-8 py-3.5 rounded-2xl bg-secondary text-light text-sm font-semibold
                     hover:bg-secondary/90 transition-colors"
        >
          {t("auth.editProfile")}
        </button>
      </div>
    );
  }

  // ── Main checkout ──────────────────────────────────────────────────────────
  const showOtpBlock = otpState === "pending" || otpState === "verifying";

  return (
    <div className="px-4 md:px-10 py-10 md:py-16 max-w-[1100px] mx-auto" dir={isAr ? "rtl" : "ltr"}>

      <a
        href="/"
        className={cn(
          "inline-flex items-center gap-1.5 text-sm text-dark/45 hover:text-dark/70 transition-colors mb-8",
          isAr && "flex-row-reverse"
        )}
      >
        <ArrowLeft size={15} className={isAr ? "rotate-180" : ""} />
        {t("checkout.backToServices")}
      </a>

      <h1 className="text-2xl font-bold text-dark mb-8">{t("checkout.title")}</h1>

      <div className="grid md:grid-cols-[1fr_360px] gap-8 items-start">

        {/* ── Order summary ── */}
        <div className="border border-dark/8 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-dark/6">
            <h2 className="text-sm font-semibold text-dark/70">{t("checkout.orderSummary")}</h2>
          </div>

          <ul className="divide-y divide-dark/6">
            <AnimatePresence initial={false}>
              {items.map((cartItem) => {
                const name = isAr && cartItem.snapshot.nameAr
                  ? cartItem.snapshot.nameAr
                  : cartItem.snapshot.name;
                const group = isAr && cartItem.snapshot.groupLabelAr
                  ? cartItem.snapshot.groupLabelAr
                  : cartItem.snapshot.groupLabel;
                const linePrice = (cartItem.snapshot.numericPrice ?? 0) * cartItem.qty;
                const baseId = cartItem.id.includes("::") ? cartItem.id.split("::")[0] : cartItem.id;
                const unavailable = unavailableIds.has(baseId);

                return (
                  <motion.li
                    key={cartItem.id}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className={cn("px-5 py-4", unavailable && "bg-red-50/60")}
                  >
                    {unavailable && (
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-semibold text-red-500 uppercase tracking-wide">
                          {t("cart.unavailable")}
                        </span>
                        <button
                          onClick={() => removeItem(cartItem.id)}
                          className="text-[10px] font-semibold text-red-400 hover:text-red-600 underline"
                        >
                          {t("cart.remove")}
                        </button>
                      </div>
                    )}
                    {/* Row 1: image/icon + name + delete */}
                    <div className={cn("flex items-start gap-3", unavailable && "opacity-50")}>
                      {resolveImage(cartItem.snapshot.imageUrl, cartItem.snapshot.unsplashId, 120) ? (
                        <img
                          src={resolveImage(cartItem.snapshot.imageUrl, cartItem.snapshot.unsplashId, 120)!}
                          alt={name}
                          className="w-10 h-10 rounded-xl object-cover shrink-0 grayscale"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                          <span className="text-secondary text-lg">{cartItem.snapshot.icon ?? "✦"}</span>
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        {group && (
                          <p className="text-xs font-medium text-secondary mb-0.5">{group}</p>
                        )}
                        <p className={cn("text-sm font-semibold text-dark leading-snug", unavailable && "line-through")}>{name}</p>
                      </div>

                      <motion.button
                        whileTap={{ scale: 0.82 }}
                        onClick={() => removeItem(cartItem.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-xl shrink-0
                                   text-dark/25 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={13} />
                      </motion.button>
                    </div>

                    {/* Row 2: qty controls + price (indented to align with name) */}
                    <div className={cn("flex items-center justify-between mt-3 ms-[52px]", unavailable && "pointer-events-none opacity-40")}>
                      <div className="flex items-center gap-1.5 bg-dark/5 rounded-xl px-2 py-1.5">
                        <motion.button
                          whileTap={{ scale: 0.82 }}
                          onClick={() =>
                            cartItem.qty <= 1
                              ? removeItem(cartItem.id)
                              : updateQty(cartItem.id, cartItem.qty - 1)
                          }
                          className="w-6 h-6 flex items-center justify-center rounded-lg
                                     text-dark/40 hover:text-dark transition-colors"
                        >
                          <Minus size={12} strokeWidth={2.5} />
                        </motion.button>
                        <span className="w-5 text-center text-xs font-semibold text-dark tabular-nums">
                          {cartItem.qty}
                        </span>
                        <motion.button
                          whileTap={{ scale: 0.82 }}
                          onClick={() => updateQty(cartItem.id, cartItem.qty + 1)}
                          className="w-6 h-6 flex items-center justify-center rounded-lg
                                     text-dark/40 hover:text-dark transition-colors"
                        >
                          <Plus size={12} strokeWidth={2.5} />
                        </motion.button>
                      </div>

                      <span className="text-sm font-bold text-dark tabular-nums">
                        {linePrice} OMR
                      </span>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>

          <div className="px-5 py-4 border-t border-dark/8 flex justify-between items-center bg-dark/[0.015]">
            <span className="text-sm text-dark/55">{t("checkout.subtotal")}</span>
            <span className="text-base font-bold text-dark tabular-nums">{subtotal} OMR</span>
          </div>
        </div>

        {/* ── Payment card + iframe column ── */}
        <div className="flex flex-col gap-4">
        <div className={cn("border border-dark/8 rounded-2xl p-6 flex flex-col gap-5", !iframeUrl && "md:sticky md:top-24")}>
          <h2 className="text-sm font-semibold text-dark/70">{t("checkout.payment")}</h2>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-dark/55">{t("checkout.subtotal")}</span>
              <span className="text-sm font-medium text-dark tabular-nums">{subtotal} OMR</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-dark/6">
              <span className="text-sm font-semibold text-dark">{t("checkout.total")}</span>
              <span className="text-lg font-bold text-dark tabular-nums">{subtotal} OMR</span>
            </div>
          </div>

          {/* User info pill */}
          {user && (
            <div className="flex items-center gap-2 px-3 py-2 bg-dark/[0.03] rounded-xl">
              <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
                <UserCircle size={14} className="text-secondary" />
              </div>
              <span className="text-xs text-dark/55 truncate">{user.email}</span>
            </div>
          )}

          {/* OTP block */}
          <AnimatePresence>
            {otpState === "verified" && (
              <motion.div
                key="otp-verified"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-200"
              >
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                <span className="text-xs font-medium text-emerald-700">{t("checkout.otpVerified")}</span>
              </motion.div>
            )}

            {showOtpBlock && (
              <motion.div
                key="otp-input"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22 }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-2 pt-1">
                  <div className="flex items-center gap-1.5 text-xs text-dark/50">
                    <Mail size={12} />
                    <span>{t("checkout.otpSent").replace("{email}", user?.email ?? "")}</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder={t("checkout.otpPlaceholder")}
                      value={otpCode}
                      onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setOtpError(""); }}
                      className="flex-1 text-center tracking-[0.35em] font-bold text-lg py-2.5 rounded-xl
                                 bg-dark/[0.04] border border-dark/10 outline-none
                                 focus:border-primary/40 focus:bg-primary/[0.03] transition-all"
                    />
                    <button
                      onClick={verifyOtp}
                      disabled={otpCode.length !== 6 || otpState === "verifying"}
                      className={cn(
                        "px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shrink-0",
                        otpCode.length === 6 && otpState !== "verifying"
                          ? "bg-primary text-light hover:bg-primary/90"
                          : "bg-dark/8 text-dark/30 cursor-not-allowed"
                      )}
                    >
                      {otpState === "verifying"
                        ? <Loader2 size={14} className="animate-spin" />
                        : t("checkout.otpVerify")}
                    </button>
                  </div>
                  {otpError && (
                    <p className="text-xs text-red-500 px-1">{otpError}</p>
                  )}
                  <button
                    onClick={sendOtp}
                    disabled={otpState === "verifying"}
                    className="text-xs text-primary hover:underline text-start disabled:opacity-40"
                  >
                    {t("checkout.otpResend")}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Terms checkbox */}
          <label className="flex items-start gap-2.5 cursor-pointer group">
            <div className="relative mt-0.5 shrink-0">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="sr-only peer"
              />
              <div className={cn(
                "w-4 h-4 rounded flex items-center justify-center border transition-colors",
                termsAccepted
                  ? "bg-primary border-primary"
                  : "border-dark/25 group-hover:border-primary/50"
              )}>
                {termsAccepted && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </div>
            <span className="text-xs text-dark/50 leading-relaxed">
              {isAr ? "أوافق على " : "I agree to the "}
              <a href="/terms" target="_blank" className="text-primary hover:underline font-medium">
                {isAr ? "الشروط والأحكام" : "Terms & Conditions"}
              </a>
              {isAr ? " و" : " and "}
              <a href="/privacy" target="_blank" className="text-primary hover:underline font-medium">
                {isAr ? "سياسة الخصوصية" : "Privacy Policy"}
              </a>
            </span>
          </label>

          {hasUnavailableItems && (
            <p className="text-xs text-red-500 font-medium text-center -mb-1">
              {t("cart.unavailableCheckout")}
            </p>
          )}

          {!iframeUrl && (
            <>
              <button
                onClick={() => handlePaymob()}
                disabled={!termsAccepted || payLoading || totalCount === 0 || hasUnavailableItems || otpState === "sending" || otpState === "pending" || otpState === "verifying"}
                className={cn(
                  "w-full py-4 rounded-2xl text-sm font-semibold transition-colors duration-200",
                  "flex items-center justify-center gap-2",
                  !termsAccepted || payLoading || totalCount === 0 || hasUnavailableItems || otpState === "sending" || otpState === "pending" || otpState === "verifying"
                    ? "bg-primary/50 text-light cursor-not-allowed"
                    : "bg-primary text-light hover:bg-primary/90"
                )}
              >
                {payLoading || otpState === "sending" ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <CreditCard size={17} />
                )}
                {payLoading || otpState === "sending"
                  ? t("checkout.processing")
                  : t("checkout.payWithPaymob")}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-dark/35">
                <Lock size={11} />
                <span className="text-xs">{t("checkout.securePayment")}</span>
              </div>
            </>
          )}
        </div>

        {/* ── Paymob iframe — same column as payment card ── */}
        <AnimatePresence>
          {iframeUrl && (
            <motion.div
              key="paymob-iframe"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="border border-dark/8 rounded-2xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-dark/8 flex items-center justify-between bg-dark/[0.015]">
                  <div className="flex items-center gap-2 text-sm font-semibold text-dark/70">
                    <Lock size={13} className="text-primary" />
                    {t("checkout.securePayment")}
                  </div>
                  {!iframeLoaded && (
                    <Loader2 size={15} className="animate-spin text-dark/30" />
                  )}
                </div>
                <div className="relative" style={{ height: 600 }}>
                  {!iframeLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-light">
                      <Loader2 size={28} className="animate-spin text-dark/20" />
                    </div>
                  )}
                  <iframe
                    src={iframeUrl}
                    className="w-full h-full border-0"
                    title="Paymob Payment"
                    allow="payment"
                    onLoad={() => setIframeLoaded(true)}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
