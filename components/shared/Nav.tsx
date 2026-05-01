"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Globe, Heart, LogOut, ShoppingBag, UserCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useCart, useFavs, useUI } from "@/lib/shop-context";
import { useLang } from "@/lib/lang-context";

export default function Nav() {
  const { totalCount } = useCart();
  const { ids } = useFavs();
  const { setCartOpen, setFavsOpen, setAuthOpen, setAuthStep, setProfileDrawerOpen } = useUI();
  const { t, lang, setLang } = useLang();
  const [user, setUser] = useState<User | null>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      setAvatarFailed(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  function toggleLang() {
    setLang(lang === "en" ? "ar" : "en");
  }

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-light/95 backdrop-blur-xl border-b border-dark/8">
      <div className="grid grid-cols-3 items-center h-16 px-5 md:px-10 max-w-[1400px] mx-auto w-full">

        {/* LEFT — Sign In / Avatar + Logout */}
        <div className="flex items-center gap-1">
          {user ? (
            <>
              <button
                onClick={async () => {
                  const { data: { user: u } } = await supabase.auth.getUser();
                  if (!u) return;
                  const { data } = await supabase.from("profiles").select("username, phone, age").eq("id", u.id).single();
                  const hasProfile = !!(data?.username || data?.phone || data?.age);
                  if (hasProfile) {
                    setProfileDrawerOpen(true);
                  } else {
                    setAuthStep("profile");
                    setAuthOpen(true);
                  }
                }}
                aria-label={t("nav.profile")}
                className="w-9 h-9 rounded-full flex items-center justify-center
                           bg-primary/10 text-primary hover:bg-primary/18 transition-colors overflow-hidden"
              >
                {user.user_metadata?.avatar_url && !avatarFailed ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={() => setAvatarFailed(true)}
                  />
                ) : (
                  <UserCircle size={20} strokeWidth={1.6} />
                )}
              </button>
              <button
                onClick={() => supabase.auth.signOut()}
                aria-label={t("nav.signOut")}
                className="w-8 h-8 rounded-full flex items-center justify-center
                           text-dark/35 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut size={15} strokeWidth={1.7} />
              </button>
            </>
          ) : (
            <button
              onClick={() => { setAuthStep("signin"); setAuthOpen(true); }}
              className="text-xs font-semibold text-dark/60 px-3.5 py-1.5 rounded-xl
                         bg-dark/[0.04] hover:bg-dark/[0.08] hover:text-dark
                         transition-all duration-200"
            >
              {t("nav.signIn")}
            </button>
          )}
        </div>

        {/* CENTER — Logo */}
        <div className="flex justify-center">
          <Link href="/" aria-label="WellnessHub home">
            <Image
              src="/media/Logo.svg"
              alt="WellnessHub"
              width={38}
              height={38}
              priority
              className="w-9 h-9 object-contain"
            />
          </Link>
        </div>

        {/* RIGHT — Favs + Globe + Cart */}
        <div className="flex items-center justify-end gap-1">
          <Link
            href="/about"
            className="hidden sm:flex text-xs font-medium text-dark/50 hover:text-dark/80
                       px-3 py-1.5 rounded-xl hover:bg-dark/5 transition-all duration-200"
          >
            {t("nav.about")}
          </Link>

          {/* Favs — hidden on mobile, bottom nav handles it */}
          <button
            onClick={() => setFavsOpen(true)}
            aria-label={`${t("favs.title")}${ids.size > 0 ? `, ${ids.size}` : ""}`}
            className="hidden md:flex relative w-9 h-9 items-center justify-center rounded-xl
                       text-dark/45 hover:text-secondary hover:bg-secondary/8 transition-all duration-200"
          >
            <Heart
              size={17}
              strokeWidth={1.7}
              className={ids.size > 0 ? "fill-secondary text-secondary" : ""}
            />
            <AnimatePresence>
              {ids.size > 0 && (
                <motion.span
                  key="fav-badge"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full
                             bg-secondary text-light text-[9px] font-bold
                             flex items-center justify-center tabular-nums"
                >
                  {ids.size > 9 ? "9+" : ids.size}
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Globe — language toggle */}
          <button
            onClick={toggleLang}
            aria-label="Switch language"
            className="w-9 h-9 flex items-center justify-center rounded-xl
                       text-dark/40 hover:text-dark/70 hover:bg-dark/5 transition-all duration-200 relative"
          >
            <Globe size={17} strokeWidth={1.7} />
            <span className="absolute -bottom-0.5 -right-0.5 text-[8px] font-bold text-primary leading-none">
              {t("lang")}
            </span>
          </button>

          {/* Cart — hidden on mobile, bottom nav handles it */}
          <motion.button
            onClick={() => setCartOpen(true)}
            aria-label={`${t("cart.title")}${totalCount > 0 ? `, ${totalCount}` : ""}`}
            whileTap={{ scale: 0.88 }}
            className="hidden md:flex relative w-9 h-9 items-center justify-center rounded-xl
                       text-dark/45 hover:text-primary hover:bg-primary/8 transition-all duration-200"
          >
            <ShoppingBag size={17} strokeWidth={1.7} />
            <AnimatePresence>
              {totalCount > 0 && (
                <motion.span
                  key="nav-badge"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full
                             bg-primary text-light text-[9px] font-bold
                             flex items-center justify-center tabular-nums"
                >
                  {totalCount > 9 ? "9+" : totalCount}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </header>
  );
}
