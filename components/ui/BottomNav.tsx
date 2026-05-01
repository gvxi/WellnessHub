"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Heart, Home, Info, Phone, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart, useFavs, useUI } from "@/lib/shop-context";
import { useLang } from "@/lib/lang-context";
import { cn } from "@/lib/utils";

export default function BottomNav() {
  const pathname = usePathname();
  const { totalCount } = useCart();
  const { ids } = useFavs();
  const { setCartOpen, setFavsOpen } = useUI();
  const { t } = useLang();

  const isHome = pathname === "/";
  const isCheckout = pathname.startsWith("/checkout");

  return (
    <AnimatePresence>
    {!isCheckout && (
    <motion.nav
      key="bottom-nav"
      initial={{ y: 0 }}
      animate={{ y: 0 }}
      exit={{ y: 100 }}
      transition={{ type: "spring", stiffness: 380, damping: 34 }}
      className="fixed bottom-0 inset-x-0 z-50 md:hidden"
    >
      {/* Glass bar */}
      <div className="relative bg-light/90 backdrop-blur-xl border-t border-dark/8 h-[68px]">
        <div className="grid grid-cols-5 h-full items-center px-1">

          {/* About Us */}
          <NavTab label={t("bottomNav.about")} href="/about">
            <Info size={22} strokeWidth={1.6} />
          </NavTab>

          {/* Contact Us */}
          <NavTab label={t("bottomNav.contact")} href="/about#contact">
            <Phone size={22} strokeWidth={1.6} />
          </NavTab>

          {/* Cart — center elevated circle */}
          <div className="flex justify-center">
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => setCartOpen(true)}
              aria-label={`Cart${totalCount > 0 ? `, ${totalCount} items` : ""}`}
              className="relative w-14 h-14 -mt-7 rounded-full bg-primary text-light
                         flex items-center justify-center shadow-lg shadow-primary/30
                         ring-4 ring-light"
            >
              <ShoppingBag size={22} strokeWidth={1.8} />
              <AnimatePresence>
                {totalCount > 0 && (
                  <motion.span
                    key="cart-badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full
                               bg-accent text-dark text-[10px] font-bold
                               flex items-center justify-center tabular-nums"
                  >
                    {totalCount > 9 ? "9+" : totalCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>

          {/* Favorites */}
          <button
            onClick={() => setFavsOpen(true)}
            aria-label={`Favorites${ids.size > 0 ? `, ${ids.size} saved` : ""}`}
            className="flex flex-col items-center justify-center gap-0.5 w-full h-full
                       text-dark/40 hover:text-secondary transition-colors relative"
          >
            <div className="relative">
              <Heart
                size={22}
                strokeWidth={1.6}
                className={cn(ids.size > 0 && "fill-secondary text-secondary")}
              />
              <AnimatePresence>
                {ids.size > 0 && (
                  <motion.span
                    key="fav-badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full
                               bg-secondary text-light text-[9px] font-bold
                               flex items-center justify-center tabular-nums"
                  >
                    {ids.size > 9 ? "9+" : ids.size}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <span className="text-[10px] font-medium">{t("bottomNav.favs")}</span>
          </button>

          {/* Home */}
          <NavTab label={t("bottomNav.home")} href="/" active={isHome}>
            <Home size={22} strokeWidth={1.6} />
          </NavTab>
        </div>
      </div>
    </motion.nav>
    )}
    </AnimatePresence>
  );
}

function NavTab({
  label,
  href,
  active,
  children,
}: {
  label: string;
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = active ?? (href === "/about" ? pathname.startsWith("/about") : pathname === href);

  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors",
        isActive ? "text-primary" : "text-dark/40 hover:text-dark/70"
      )}
    >
      {children}
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}
