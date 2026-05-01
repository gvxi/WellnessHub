"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, User, Phone, Calendar, Pencil, ShoppingBag, UserCircle, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { useUI } from "@/lib/shop-context";
import { useLang } from "@/lib/lang-context";
import { cn } from "@/lib/utils";

type Profile = {
  username: string | null;
  phone: string | null;
  age: number | null;
};

type CartItemJson = { name: string; qty: number; line_total: number; currency: string };

type Booking = {
  id: string;
  created_at: string;
  status: string;
  cart_items: CartItemJson[] | null;
  total_amount: number | null;
};

function StatusIcon({ status }: { status: string }) {
  if (status === "approved") return <CheckCircle2 size={13} className="text-green-500" />;
  if (status === "rejected") return <XCircle size={13} className="text-red-400" />;
  return <Clock size={13} className="text-amber-400" />;
}

function statusLabel(status: string, t: (k: string) => string) {
  if (status === "approved") return t("admin.status_approved");
  if (status === "rejected") return t("admin.status_rejected");
  if (status === "refunded") return t("admin.status_refunded");
  return t("admin.status_pending");
}

export default function ProfileDrawer() {
  const { profileDrawerOpen, setProfileDrawerOpen, setAuthOpen, setAuthStep } = useUI();
  const { t, isRTL } = useLang();

  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  useEffect(() => {
    if (!profileDrawerOpen) return;
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user ?? null;
      setUser(u);
      setAvatarFailed(false);
      if (!u) return;
      supabase.from("profiles").select("username, phone, age").eq("id", u.id).single()
        .then(({ data: p }) => setProfile(p ?? null));
      setLoadingBookings(true);
      supabase.from("bookings").select("id, created_at, status, cart_items, total_amount")
        .eq("customer_id", u.id)
        .order("created_at", { ascending: false })
        .limit(20)
        .then(({ data: b }) => {
          setBookings((b as Booking[]) ?? []);
          setLoadingBookings(false);
        });
    });
  }, [profileDrawerOpen]);

  useEffect(() => {
    if (!profileDrawerOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setProfileDrawerOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [profileDrawerOpen, setProfileDrawerOpen]);

  useEffect(() => {
    document.body.style.overflow = profileDrawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [profileDrawerOpen]);

  function close() { setProfileDrawerOpen(false); }

  function openEdit() {
    close();
    setTimeout(() => { setAuthStep("profile"); setAuthOpen(true); }, 200);
  }

  return (
    <AnimatePresence>
      {profileDrawerOpen && (
        <>
          <motion.div
            key="profile-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-dark/40 backdrop-blur-sm"
            onClick={close}
          />

          <motion.div
            key="profile-drawer"
            initial={{ x: isRTL ? "-100%" : "100%" }}
            animate={{ x: 0 }}
            exit={{ x: isRTL ? "-100%" : "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className={cn(
              "fixed top-0 bottom-0 z-50 w-full max-w-[360px] bg-light shadow-2xl flex flex-col",
              isRTL ? "left-0" : "right-0"
            )}
            dir={isRTL ? "rtl" : "ltr"}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-dark/8 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center shrink-0">
                  {user?.user_metadata?.avatar_url && !avatarFailed ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={() => setAvatarFailed(true)}
                    />
                  ) : (
                    <UserCircle size={22} className="text-primary/60" strokeWidth={1.5} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-dark truncate">
                    {profile?.username || user?.email?.split("@")[0] || "—"}
                  </p>
                  <p className="text-xs text-dark/40 truncate">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={openEdit}
                  aria-label={t("auth.editProfile")}
                  className="w-8 h-8 rounded-full flex items-center justify-center
                             text-dark/40 hover:text-primary hover:bg-primary/8 transition-colors"
                >
                  <Pencil size={14} strokeWidth={1.8} />
                </button>
                <button
                  onClick={close}
                  aria-label="Close"
                  className="w-8 h-8 rounded-full flex items-center justify-center
                             text-dark/40 hover:text-dark hover:bg-dark/8 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {/* Profile info */}
              <div className="px-5 pt-5 pb-4">
                <p className="text-[10px] font-semibold text-dark/35 uppercase tracking-wider mb-3">
                  {t("auth.completeProfile")}
                </p>
                <div className="flex flex-col gap-2">
                  <InfoRow icon={User} label={t("auth.usernamePlaceholder")} value={profile?.username ?? null} />
                  <InfoRow icon={Phone} label={t("auth.phonePlaceholder")} value={profile?.phone ?? null} />
                  <InfoRow icon={Calendar} label={t("auth.agePlaceholder")} value={profile?.age != null ? String(profile.age) : null} />
                </div>
              </div>

              <div className="mx-5 h-px bg-dark/8" />

              {/* Booking history */}
              <div className="px-5 pt-4 pb-6">
                <div className="flex items-center gap-2 mb-3">
                  <ShoppingBag size={13} className="text-dark/35" />
                  <p className="text-[10px] font-semibold text-dark/35 uppercase tracking-wider">
                    {t("profile.bookingHistory")}
                  </p>
                </div>

                {loadingBookings ? (
                  <div className="flex justify-center py-8">
                    <div className="w-5 h-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-dark/35">{t("profile.noBookings")}</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {bookings.map((b) => (
                      <div key={b.id} className="flex items-start gap-3 py-3 px-3 rounded-2xl bg-dark/[0.03] border border-dark/8">
                        <StatusIcon status={b.status} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-dark font-medium truncate">
                            {b.cart_items?.[0]?.name ?? "—"}
                            {(b.cart_items?.length ?? 0) > 1 && (
                              <span className="text-dark/40 text-xs ms-1">+{b.cart_items!.length - 1}</span>
                            )}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-dark/40">
                              {new Date(b.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                            <span className="text-[10px] text-dark/30">·</span>
                            <span className="text-[11px] text-dark/50 font-medium">
                              {statusLabel(b.status, t)}
                            </span>
                          </div>
                        </div>
                        {b.total_amount != null && (
                          <p className="text-sm font-semibold text-dark/70 shrink-0 tabular-nums">
                            {b.total_amount} OMR
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null }) {
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-2xl bg-dark/[0.03] border border-dark/8">
      <Icon size={14} className="text-dark/30 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-dark/35 uppercase tracking-wider font-medium leading-tight">{label}</p>
        <p className="text-sm text-dark font-medium truncate">{value || "—"}</p>
      </div>
    </div>
  );
}
