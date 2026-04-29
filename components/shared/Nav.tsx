"use client";

import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { Globe, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCart, useUI } from "@/lib/shop-context";

export default function Nav() {
  const { totalCount } = useCart();
  const { setCartOpen } = useUI();
  const { scrollY } = useScroll();
  const bgOpacity = useTransform(scrollY, [0, 60], [0, 0.9]);
  const borderOpacity = useTransform(scrollY, [0, 60], [0, 0.07]);
  const textColor = useTransform(
    scrollY,
    [0, 60],
    ["rgba(255,255,255,0.88)", "rgba(14,11,13,0.65)"]
  );
  const logoInvert = useTransform(scrollY, [0, 60], [1, 0]);

  return (
    <motion.header className="fixed top-0 inset-x-0 z-50">
      {/* Glass layer */}
      <motion.div
        className="absolute inset-0 border-b border-dark/0"
        style={{
          backgroundColor: useTransform(bgOpacity, (v) => `rgba(242,237,238,${v})`),
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          borderColor: useTransform(borderOpacity, (v) => `rgba(14,11,13,${v})`),
        }}
      />

      {/* 3-column grid */}
      <div className="relative grid grid-cols-3 items-center h-16 px-5 md:px-10 max-w-[1400px] mx-auto w-full">

        {/* LEFT — Sign In */}
        <motion.div style={{ color: textColor }} className="flex items-center">
          <Link
            href="/login"
            className="text-sm font-medium px-4 py-1.5 rounded-xl border border-current/25
                       hover:border-current/50 hover:bg-current/5 transition-all duration-200"
          >
            Sign In
          </Link>
        </motion.div>

        {/* CENTER — Logo (SVG, inverts from white→dark on scroll) */}
        <div className="flex justify-center">
          <Link href="/" aria-label="WellnessHub home">
            <motion.div style={{ filter: useTransform(logoInvert, (v) => `invert(${v})`) }}>
              <Image
                src="/media/Logo.svg"
                alt="WellnessHub"
                width={44}
                height={44}
                priority
                className="w-11 h-11 object-contain"
              />
            </motion.div>
          </Link>
        </div>

        {/* RIGHT — About + Globe */}
        <motion.div
          style={{ color: textColor }}
          className="flex items-center justify-end gap-3"
        >
          <Link
            href="#about"
            className="text-sm font-medium hover:opacity-100 opacity-90 transition-opacity duration-200 hidden sm:block"
          >
            About Us
          </Link>
          <button
            aria-label="Switch language"
            className="w-8 h-8 flex items-center justify-center rounded-xl
                       hover:bg-current/8 transition-colors duration-200 opacity-70 hover:opacity-100"
          >
            <Globe size={16} strokeWidth={1.6} />
          </button>

          {/* Cart — desktop only */}
          <motion.button
            onClick={() => setCartOpen(true)}
            aria-label={`Cart${totalCount > 0 ? `, ${totalCount} items` : ""}`}
            whileTap={{ scale: 0.88 }}
            className="relative hidden md:flex w-8 h-8 items-center justify-center rounded-xl
                       hover:bg-current/8 transition-colors duration-200 opacity-80 hover:opacity-100"
          >
            <ShoppingBag size={16} strokeWidth={1.6} />
            <AnimatePresence>
              {totalCount > 0 && (
                <motion.span
                  key="nav-badge"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full
                             bg-primary text-light text-[9px] font-bold
                             flex items-center justify-center tabular-nums"
                >
                  {totalCount > 9 ? "9+" : totalCount}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </motion.div>
      </div>
    </motion.header>
  );
}
