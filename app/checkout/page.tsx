"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, CreditCard, Lock, Loader2, ShoppingBag,
  Minus, Plus, Trash2, UserCircle, AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/lib/shop-context";
import { useUI } from "@/lib/shop-context";
import { useLang } from "@/lib/lang-context";
import { useToast } from "@/lib/toast-context";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";

type AuthState = "loading" | "unauthenticated" | "incomplete-profile" | "ready";

export default function CheckoutPage() {
  const { items, totalCount, removeItem, updateQty } = useCart();
  const { setAuthOpen, setAuthStep } = useUI();
  const { t, lang } = useLang();
  const { showToast } = useToast();
  const router = useRouter();
  const isAr = lang === "ar";

  const [authState, setAuthState] = useState<AuthState>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [payLoading, setPayLoading] = useState(false);

  const subtotal = items.reduce(
    (sum, item) => sum + (item.snapshot.numericPrice ?? 0) * item.qty,
    0
  );

  // ── Auth + profile check ───────────────────────────────────────────────────
  async function checkAuth(u: User | null) {
    if (!u) { setAuthState("unauthenticated"); return; }
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, phone")
      .eq("id", u.id)
      .single();
    if (!profile?.username || !profile?.phone) {
      setAuthState("incomplete-profile");
    } else {
      setAuthState("ready");
    }
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u);
      checkAuth(u);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      const u = session?.user ?? null;
      setUser(u);
      checkAuth(u);
    });
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (totalCount === 0 && authState !== "loading") {
      const timer = setTimeout(() => router.push("/"), 2000);
      return () => clearTimeout(timer);
    }
  }, [totalCount, authState, router]);

  // ── Paymob initiate ────────────────────────────────────────────────────────
  async function handlePaymob() {
    if (authState !== "ready") return;
    setPayLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
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

      if (data.payment_url) {
        router.push(data.payment_url);
        return;
      }

      // Placeholder — booking created
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

                return (
                  <motion.li
                    key={cartItem.id}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-4 px-5 py-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                      <span className="text-secondary text-lg">{cartItem.snapshot.icon ?? "✦"}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      {group && (
                        <p className="text-xs font-medium text-secondary mb-0.5 truncate">{group}</p>
                      )}
                      <p className="text-sm font-medium text-dark truncate">{name}</p>
                    </div>

                    {/* Qty controls */}
                    <div className="flex items-center gap-2 shrink-0">
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

                      <span className="text-sm font-semibold text-dark tabular-nums w-16 text-end">
                        {linePrice} OMR
                      </span>

                      <motion.button
                        whileTap={{ scale: 0.82 }}
                        onClick={() => removeItem(cartItem.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-xl
                                   text-dark/25 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={13} />
                      </motion.button>
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

        {/* ── Payment card ── */}
        <div className="border border-dark/8 rounded-2xl p-6 flex flex-col gap-5 md:sticky md:top-24">
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

          <button
            onClick={handlePaymob}
            disabled={payLoading || totalCount === 0}
            className={cn(
              "w-full py-4 rounded-2xl text-sm font-semibold transition-colors duration-200",
              "flex items-center justify-center gap-2",
              payLoading || totalCount === 0
                ? "bg-primary/50 text-light cursor-not-allowed"
                : "bg-primary text-light hover:bg-primary/90"
            )}
          >
            {payLoading ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <CreditCard size={17} />
            )}
            {payLoading ? t("checkout.processing") : t("checkout.payWithPaymob")}
          </button>

          <div className="flex items-center justify-center gap-1.5 text-dark/35">
            <Lock size={11} />
            <span className="text-xs">{t("checkout.securePayment")}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
