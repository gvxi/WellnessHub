"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { TargetAndTransition, Transition } from "framer-motion";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ChevronLeft, Loader2, CheckCircle2, XCircle, Banknote,
  CreditCard, QrCode, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/lang-context";
import { playPaymentAccepted, playPaymentRejected } from "@/lib/sounds";

// ── Types ──────────────────────────────────────────────────────────────────
type Cart = {
  id: string;
  label: string;
  items: Array<{
    key: string;
    name: string;
    nameAr?: string;
    price: string;
    numericPrice: number;
    tierLabel?: string;
    tierLabelAr?: string;
    qty: number;
    categoryTitle: string;
    itemId: string;
  }>;
};

type PaymentMethod = "Cash" | "POS Machine" | "QR/Transfer";
type Step = 1 | 2 | 3 | 4 | "5a" | "5b";

interface Props {
  open: boolean;
  cart: Cart;
  onSuccess: (cartId: string, status: "approved" | "rejected") => void;
  onClose: () => void;
  showToast: (msg: string, kind?: "success" | "error" | "info") => void;
  soundEnabled?: boolean;
}

const SPRING = { type: "spring" as const, stiffness: 340, damping: 34 };

// 3 random animation variants for Step 4
const ANIM_VARIANTS: { animate: TargetAndTransition; transition: Transition }[] = [
  { animate: { scale: [1, 1.18, 1] }, transition: { duration: 1.4, repeat: Infinity, ease: "easeInOut" } },
  { animate: { y: [0, -14, 0] },       transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" } },
  { animate: { rotate: [0, 360] },      transition: { duration: 2, repeat: Infinity, ease: "linear" } },
];

export default function PosCheckoutDrawer({ open, cart, onSuccess, onClose, showToast, soundEnabled = true }: Props) {
  const { t, lang } = useLang();
  const [step, setStep] = useState<Step>(1);
  const [customer, setCustomer] = useState({ name: "", email: "" });
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showActions, setShowActions] = useState(false); // Step 4: reveal after 3s
  const [bookingStatus, setBookingStatus] = useState<"approved" | "rejected" | null>(null);
  const animVariantRef = useRef(Math.floor(Math.random() * 3));

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep(1);
      setCustomer({ name: "", email: "" });
      setSessionId(null);
      setPaymentMethod(null);
      setError(null);
      setLoading(false);
      setShowActions(false);
      setBookingStatus(null);
      animVariantRef.current = Math.floor(Math.random() * 3);
    }
  }, [open]);

  // Step 4: reveal action buttons after 3s
  useEffect(() => {
    if (step !== 4) return;
    setShowActions(false);
    const t = setTimeout(() => setShowActions(true), 3000);
    return () => clearTimeout(t);
  }, [step]);

  // ── Handlers ────────────────────────────────────────────────────────────

  async function handleSendOtp() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pos/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: customer.email, lang }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to send OTP"); return; }
      setSessionId(data.session_id);
      setStep(2);
      showToast(t("pos.toast_code_sent"), "success");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pos/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: customer.email, lang }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to resend"); return; }
      setSessionId(data.session_id);
      setError(null);
      showToast(t("pos.toast_code_resent"), "info");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(code: string) {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pos/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error === "expired" ? "Code expired — resend to get a new one" : "Invalid code");
        return;
      }
      setStep(3);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateBooking(status: "approved" | "rejected") {
    if (!sessionId || !paymentMethod) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pos/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          otp_session_id: sessionId,
          customer,
          items: cart.items.map((i) => ({
            name: i.name,
            name_ar: i.nameAr,
            price: i.price,
            numericPrice: i.numericPrice,
            tierLabel: i.tierLabel,
            tierLabelAr: i.tierLabelAr,
            qty: i.qty,
            categoryTitle: i.categoryTitle,
          })),
          payment_method: paymentMethod,
          status,
          lang,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to create booking"); return; }
      if (soundEnabled) { if (status === "approved") playPaymentAccepted(); else playPaymentRejected(); }
      setBookingStatus(status);
      setStep("5b");
      setTimeout(() => onSuccess(cart.id, status), 1400);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  const totalAmount = cart.items.reduce((s, i) => s + i.numericPrice * i.qty, 0);
  const itemCount = cart.items.reduce((s, i) => s + i.qty, 0);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Blocking backdrop */}
          <motion.div
            key="checkout-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-dark/50 backdrop-blur-sm"
          />

          {/* Sheet — mobile: bottom sheet; desktop: 50% centred floating */}
          <motion.div
            key="checkout-sheet"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={SPRING}
            className={cn(
              "fixed z-[81] bg-light shadow-2xl flex flex-col",
              // Mobile
              "inset-x-0 bottom-0 rounded-t-3xl",
              // Desktop: centred 50% width
              "md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:bottom-8 md:w-1/2 md:min-w-[480px] md:max-w-2xl md:rounded-3xl"
            )}
            style={{ maxHeight: "90vh" }}
          >
            {/* Handle */}
            <div className="flex-none flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-dark/15" />
            </div>

            {/* Header */}
            <div className="flex-none flex items-center justify-between px-5 pb-4">
              <div>
                <h2 className="text-base font-bold text-dark">{t("pos.checkout_title")} — {cart.label}</h2>
                <p className="text-xs text-dark/40">{itemCount} · {totalAmount.toFixed(2)} OMR</p>
              </div>
              {(step === 1 || step === 2) && (
                <button onClick={onClose} className="w-8 h-8 rounded-xl bg-dark/5 flex items-center justify-center text-dark/50 hover:text-dark/80 transition-colors">
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Items summary */}
            <CartItemsPanel items={cart.items} />

            {/* Step indicator */}
            <StepIndicator step={step} />

            {/* Step content */}
            <div className="flex-1 overflow-y-auto px-5 pb-6">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <StepWrap key="s1">
                    <CustomerInfoStep
                      customer={customer}
                      onChange={setCustomer}
                      onSubmit={handleSendOtp}
                      loading={loading}
                      error={error}
                    />
                  </StepWrap>
                )}
                {step === 2 && (
                  <StepWrap key={`s2-${sessionId}`}>
                    <OtpStep
                      email={customer.email}
                      loading={loading}
                      error={error}
                      onVerify={handleVerifyOtp}
                      onResend={handleResendOtp}
                      onBack={() => setStep(1)}
                    />
                  </StepWrap>
                )}
                {step === 3 && (
                  <StepWrap key="s3">
                    <PaymentMethodStep
                      onSelect={(m) => { setPaymentMethod(m); setStep(4); }}
                    />
                  </StepWrap>
                )}
                {step === 4 && paymentMethod && (
                  <StepWrap key="s4">
                    <PaymentAwaitingStep
                      method={paymentMethod}
                      animVariant={animVariantRef.current}
                      showActions={showActions}
                      onBack={() => setStep(3)}
                      onReceived={() => handleCreateBooking("approved")}
                      onDeclined={() => setStep("5a")}
                      loading={loading}
                      error={error}
                    />
                  </StepWrap>
                )}
                {step === "5a" && (
                  <StepWrap key="s5a">
                    <DeclineConfirmStep
                      loading={loading}
                      error={error}
                      onConfirm={() => handleCreateBooking("rejected")}
                      onCancel={() => setStep(4)}
                    />
                  </StepWrap>
                )}
                {step === "5b" && (
                  <StepWrap key="s5b">
                    <SuccessStep customerName={customer.name} status={bookingStatus ?? "approved"} />
                  </StepWrap>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Cart items panel ───────────────────────────────────────────────────────
function CartItemsPanel({ items }: { items: Cart["items"] }) {
  const { isRTL, t } = useLang();
  const total = items.reduce((s, i) => s + i.numericPrice * i.qty, 0);

  return (
    <div className="flex-none mx-5 mb-3 border border-dark/8 rounded-2xl overflow-hidden bg-dark/[0.015]">
      {/* Column headers */}
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-3 py-2 border-b border-dark/6 bg-dark/[0.03]">
        <span className="text-[10px] font-semibold text-dark/40 uppercase tracking-wide">{t("pos.item")}</span>
        <span className="text-[10px] font-semibold text-dark/40 uppercase tracking-wide text-center w-7">{t("pos.qty")}</span>
        <span className="text-[10px] font-semibold text-dark/40 uppercase tracking-wide text-end w-16">{t("pos.price")}</span>
        <span className="text-[10px] font-semibold text-dark/40 uppercase tracking-wide text-end w-16">{t("pos.total")}</span>
      </div>

      {/* Item rows */}
      <div className="max-h-[140px] overflow-y-auto divide-y divide-dark/5">
        {items.map((item) => {
          const name = isRTL && item.nameAr ? item.nameAr : item.name;
          const tier = isRTL && item.tierLabelAr ? item.tierLabelAr : item.tierLabel;
          const lineTotal = item.numericPrice * item.qty;
          return (
            <div key={item.key} className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 items-center px-3 py-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-dark truncate">{name}</p>
                {tier && <p className="text-[10px] text-dark/40 truncate">{tier}</p>}
              </div>
              <span className="text-xs text-dark/50 text-center w-7">{item.qty}</span>
              <span className="text-xs text-dark/60 text-end w-16 tabular-nums">{item.price}</span>
              <span className="text-xs font-semibold text-dark text-end w-16 tabular-nums">{lineTotal.toFixed(3)}</span>
            </div>
          );
        })}
      </div>

      {/* Total row */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-dark/8 bg-primary/[0.04]">
        <span className="text-xs font-bold text-dark">{t("pos.total")}</span>
        <span className="text-xs font-bold text-primary tabular-nums">{total.toFixed(3)} OMR</span>
      </div>
    </div>
  );
}

// ── Step wrapper ───────────────────────────────────────────────────────────
function StepWrap({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

// ── Step indicator ─────────────────────────────────────────────────────────
function StepIndicator({ step }: { step: Step }) {
  const STEPS = [1, 2, 3, 4] as const;
  const activeNum = typeof step === "number" ? step : step === "5a" ? 4 : 4;
  return (
    <div className="flex-none flex items-center gap-1.5 px-5 pb-5">
      {STEPS.map((n) => (
        <div key={n} className={cn(
          "h-1 flex-1 rounded-full transition-colors duration-300",
          n <= activeNum ? "bg-primary" : "bg-dark/10"
        )} />
      ))}
    </div>
  );
}

// ── Step 1: Customer Info ──────────────────────────────────────────────────
function CustomerInfoStep({
  customer, onChange, onSubmit, loading, error,
}: {
  customer: { name: string; email: string };
  onChange: (c: { name: string; email: string }) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
}) {
  const { t } = useLang();
  const valid = customer.name.trim().length > 1 && customer.email.includes("@");
  return (
    <div className="space-y-4 pt-2">
      <p className="text-sm text-dark/50">{t("pos.checkout_otp_instruction").split(" ").slice(0, 6).join(" ")}…</p>
      <div className="space-y-3">
        <input
          type="text"
          placeholder={t("pos.checkout_name")}
          value={customer.name}
          onChange={(e) => onChange({ ...customer, name: e.target.value })}
          className="w-full bg-dark/[0.04] border border-dark/10 rounded-xl px-4 py-3 text-sm text-dark placeholder:text-dark/30 outline-none focus:border-primary/40 transition-colors"
        />
        <EmailInput
          placeholder={t("pos.checkout_email")}
          value={customer.email}
          onChange={v => onChange({ ...customer, email: v })}
          className="w-full bg-dark/[0.04] border border-dark/10 rounded-xl px-4 py-3 text-sm text-dark placeholder:text-dark/30 outline-none focus:border-primary/40 transition-colors"
        />
      </div>
      {error && <ErrorLine>{error}</ErrorLine>}
      <button
        onClick={onSubmit}
        disabled={!valid || loading}
        className="w-full py-3 rounded-xl bg-primary text-light text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:bg-primary/90"
      >
        {loading ? <><Loader2 size={15} className="animate-spin" /> {t("pos.checkout_sending")}</> : t("pos.checkout_send_code")}
      </button>
    </div>
  );
}

// ── Step 2: OTP ────────────────────────────────────────────────────────────
function OtpStep({
  email, loading, error, onVerify, onResend, onBack,
}: {
  email: string;
  loading: boolean;
  error: string | null;
  onVerify: (code: string) => void;
  onResend: () => void;
  onBack: () => void;
}) {
  const { t } = useLang();
  const [code, setCode] = useState("");
  return (
    <div className="space-y-4 pt-2">
      <p className="text-sm text-dark/50">{t("pos.checkout_otp_instruction")} <strong className="text-dark">{email}</strong>.</p>
      <input
        type="text"
        inputMode="numeric"
        maxLength={6}
        placeholder="000000"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        className="w-full text-center text-2xl font-bold tracking-[0.4em] bg-dark/[0.04] border border-dark/10 rounded-xl px-4 py-4 text-dark placeholder:text-dark/20 outline-none focus:border-primary/40 transition-colors font-mono"
      />
      {error && <ErrorLine>{error}</ErrorLine>}
      <button
        onClick={() => onVerify(code)}
        disabled={code.length !== 6 || loading}
        className="w-full py-3 rounded-xl bg-primary text-light text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-primary/90 transition-all"
      >
        {loading ? <><Loader2 size={15} className="animate-spin" /> {t("pos.checkout_verifying")}</> : t("pos.checkout_verify_btn")}
      </button>
      <div className="flex items-center justify-between text-xs">
        <button onClick={onBack} className="flex items-center gap-1 text-dark/40 hover:text-dark/70 transition-colors">
          <ChevronLeft size={13} /> {t("pos.checkout_back")}
        </button>
        <button onClick={onResend} disabled={loading} className="text-primary font-medium hover:text-primary/70 transition-colors disabled:opacity-50">
          {t("pos.checkout_resend")}
        </button>
      </div>
    </div>
  );
}

// ── Step 3: Payment Method ─────────────────────────────────────────────────
type PaymentOption = { method: PaymentMethod; icon: typeof Banknote; labelKey: string; descKey: string };
const PAYMENT_OPTIONS: PaymentOption[] = [
  { method: "Cash",        icon: Banknote,    labelKey: "pos.checkout_cash",  descKey: "pos.checkout_cash_desc" },
  { method: "POS Machine", icon: CreditCard,  labelKey: "pos.checkout_card",  descKey: "pos.checkout_card_desc" },
  { method: "QR/Transfer", icon: QrCode,      labelKey: "pos.checkout_qr",    descKey: "pos.checkout_qr_desc" },
];

function PaymentMethodStep({ onSelect }: { onSelect: (m: PaymentMethod) => void }) {
  const { t } = useLang();
  return (
    <div className="space-y-3 pt-2">
      <p className="text-sm text-dark/50">{t("pos.checkout_select_payment")}</p>
      {PAYMENT_OPTIONS.map(({ method, icon: Icon, labelKey, descKey }) => (
        <motion.button
          key={method}
          whileTap={{ scale: 0.97 }}
          onClick={() => onSelect(method)}
          className="w-full flex items-center gap-4 p-4 rounded-2xl border border-dark/10 hover:border-primary/30 hover:bg-primary/[0.03] transition-colors text-start"
        >
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-none">
            <Icon size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-dark">{t(labelKey)}</p>
            <p className="text-xs text-dark/40">{t(descKey)}</p>
          </div>
        </motion.button>
      ))}
    </div>
  );
}

// ── Step 4: Payment Awaiting ───────────────────────────────────────────────
function PaymentAwaitingStep({
  method, animVariant, showActions, onBack, onReceived, onDeclined, loading, error,
}: {
  method: PaymentMethod;
  animVariant: number;
  showActions: boolean;
  onBack: () => void;
  onReceived: () => void;
  onDeclined: () => void;
  loading: boolean;
  error: string | null;
}) {
  const { t } = useLang();
  const opt = PAYMENT_OPTIONS.find((o) => o.method === method)!;
  const Icon = opt.icon;
  const anim = ANIM_VARIANTS[animVariant];

  return (
    <div className="flex flex-col items-center pt-6 pb-2 gap-6">
      <div className="flex flex-col items-center gap-3">
        <motion.div
          animate={anim.animate}
          transition={anim.transition}
          className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center"
        >
          <Icon size={36} className="text-primary" />
        </motion.div>
        <p className="text-sm font-semibold text-dark">{t(opt.labelKey)}</p>
        <p className="text-xs text-dark/40">{t("pos.checkout_awaiting")}</p>
      </div>

      {error && <ErrorLine>{error}</ErrorLine>}

      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full space-y-2"
          >
            <button
              onClick={onReceived}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-emerald-600 transition-colors"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={16} />}
              {t("pos.checkout_received")}
            </button>
            <button
              onClick={onDeclined}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-red-50 text-red-500 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-red-100 transition-colors"
            >
              {t("pos.checkout_declined")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button onClick={onBack} className="flex items-center gap-1 text-xs text-dark/35 hover:text-dark/60 transition-colors">
        <ChevronLeft size={13} /> {t("pos.checkout_change_method")}
      </button>
    </div>
  );
}

// ── Step 5a: Decline Confirm ───────────────────────────────────────────────
function DeclineConfirmStep({
  loading, error, onConfirm, onCancel,
}: {
  loading: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useLang();
  return (
    <div className="flex flex-col items-center text-center pt-6 gap-5">
      <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
        <AlertCircle size={30} className="text-red-400" />
      </div>
      <div>
        <p className="text-base font-bold text-dark">{t("pos.checkout_decline_title")}</p>
        <p className="text-sm text-dark/45 mt-1">{t("pos.checkout_decline_msg")}</p>
      </div>
      {error && <ErrorLine>{error}</ErrorLine>}
      <div className="w-full space-y-2">
        <button
          onClick={onConfirm}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-red-500 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-red-600 transition-colors"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : t("pos.checkout_confirm_decline")}
        </button>
        <button onClick={onCancel} disabled={loading} className="w-full py-3 rounded-xl bg-dark/5 text-dark/70 text-sm font-semibold hover:bg-dark/10 transition-colors">
          {t("pos.cancel")}
        </button>
      </div>
    </div>
  );
}

// ── Step 5b: Result ────────────────────────────────────────────────────────
function SuccessStep({ customerName, status }: { customerName: string; status: "approved" | "rejected" }) {
  const { t } = useLang();
  const isRejected = status === "rejected";
  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex flex-col items-center text-center pt-8 gap-4"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.1 }}
        className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center",
          isRejected ? "bg-red-50" : "bg-emerald-50"
        )}
      >
        {isRejected
          ? <XCircle size={40} className="text-red-500" />
          : <CheckCircle2 size={40} className="text-emerald-500" />
        }
      </motion.div>
      <div>
        <p className="text-lg font-bold text-dark">
          {isRejected ? t("pos.checkout_declined") : t("pos.checkout_confirmed")}
        </p>
        {!isRejected && (
          <p className="text-sm text-dark/45 mt-1">{t("pos.checkout_receipt_sent")} {customerName}.</p>
        )}
      </div>
    </motion.div>
  );
}

// ── Email input with domain suggestions ───────────────────────────────────
const EMAIL_DOMAINS = ["gmail.com", "outlook.com", "hotmail.com", "yahoo.com", "icloud.com", "live.com"];

function EmailInput({
  value, onChange, placeholder, className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  className: string;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setSuggestions([]);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const computeSuggestions = useCallback((val: string) => {
    const atIdx = val.indexOf("@");
    if (atIdx < 1) { setSuggestions([]); return; }
    const domain = val.slice(atIdx + 1).toLowerCase();
    const local = val.slice(0, atIdx);
    const filtered = domain
      ? EMAIL_DOMAINS.filter(d => d.startsWith(domain) && d !== domain)
      : EMAIL_DOMAINS;
    setSuggestions(filtered.map(d => `${local}@${d}`));
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <input
        type="email"
        autoComplete="email"
        placeholder={placeholder}
        value={value}
        onChange={e => { onChange(e.target.value); computeSuggestions(e.target.value); }}
        onFocus={() => computeSuggestions(value)}
        className={className}
      />
      {suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-light border border-dark/10 rounded-xl shadow-lg overflow-hidden">
          {suggestions.map(s => {
            const at = s.indexOf("@");
            return (
              <button
                key={s}
                type="button"
                onMouseDown={e => { e.preventDefault(); onChange(s); setSuggestions([]); }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-dark/[0.04] transition-colors flex items-center gap-0"
              >
                <span className="text-dark/40">{s.slice(0, at + 1)}</span>
                <span className="font-medium text-dark">{s.slice(at + 1)}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Shared ─────────────────────────────────────────────────────────────────
function ErrorLine({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-1.5 text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
      <AlertCircle size={12} className="flex-none" />
      {children}
    </p>
  );
}
