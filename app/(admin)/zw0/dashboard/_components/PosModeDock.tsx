"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion"; // AnimatePresence used by mobile FAB
import { LogOut, Lock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/lang-context";

interface Props {
  onExit: () => void;
  onLock: () => void;
}

export default function PosModeDock({ onExit, onLock }: Props) {
  const { t } = useLang();
  const [desktopVisible, setDesktopVisible] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dockRef = useRef<HTMLDivElement>(null);

  const startHideTimer = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setDesktopVisible(false), 3000);
  }, []);

  const cancelHideTimer = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  // Desktop: reveal only when mouse is near bottom AND within dock's horizontal width
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (e.clientY <= window.innerHeight - 36) return;
      const dock = dockRef.current;
      if (dock) {
        const rect = dock.getBoundingClientRect();
        const buf = 20; // px buffer beyond pill edges
        if (e.clientX < rect.left - buf || e.clientX > rect.right + buf) return;
      }
      setDesktopVisible(true);
      startHideTimer();
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [startHideTimer]);

  // Mobile: autohide after 5s
  useEffect(() => {
    if (!mobileExpanded) return;
    const t = setTimeout(() => setMobileExpanded(false), 5000);
    return () => clearTimeout(t);
  }, [mobileExpanded]);

  // Mobile: close on outside click
  useEffect(() => {
    if (!mobileExpanded) return;
    const handler = () => setMobileExpanded(false);
    const t = setTimeout(() => window.addEventListener("click", handler), 50);
    return () => { clearTimeout(t); window.removeEventListener("click", handler); };
  }, [mobileExpanded]);

  useEffect(() => () => { if (hideTimer.current) clearTimeout(hideTimer.current); }, []);

  return (
    <>
      {/* ── Desktop: peek-from-bottom dock ── */}
      {/* Positioned at bottom-0; peeks 8px when hidden, fully shows on hover */}
      <motion.div
        animate={{ y: desktopVisible ? "-20px" : "calc(100% - 8px)" }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        onMouseEnter={() => { setDesktopVisible(true); cancelHideTimer(); }}
        onMouseLeave={startHideTimer}
        className="hidden md:flex fixed bottom-0 left-1/2 -translate-x-1/2 z-[60]"
      >
        <div ref={dockRef} className="flex items-center gap-1 px-3 py-2.5 rounded-2xl bg-dark/92 border border-white/8 shadow-2xl">
          <DockPosButton icon={<LogOut size={15} />} label={t("pos.exit_pos")} onClick={onExit} danger />
          <div className="w-px h-5 bg-white/15 mx-1" />
          <DockPosButton icon={<Lock size={15} />} label={t("pos.lock_pos")} onClick={onLock} />
        </div>
      </motion.div>

      {/* ── Mobile floating circle FAB ── */}
      <div
        className="md:hidden fixed bottom-6 right-4 z-[60]"
        onClick={(e) => e.stopPropagation()}
      >
        <AnimatePresence>
          {mobileExpanded && (
            <motion.div
              key="pos-fab-menu"
              initial={{ opacity: 0, scale: 0.8, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 8 }}
              transition={{ type: "spring", stiffness: 400, damping: 26 }}
              className="absolute bottom-14 right-0 flex flex-col gap-1.5 items-end"
            >
              <button
                onClick={() => { setMobileExpanded(false); onExit(); }}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-dark/92 text-white/90 text-sm font-medium shadow-xl whitespace-nowrap border border-white/8"
              >
                <LogOut size={14} />
                {t("pos.exit_pos")}
              </button>
              <button
                onClick={() => { setMobileExpanded(false); onLock(); }}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-dark/92 text-white/90 text-sm font-medium shadow-xl whitespace-nowrap border border-white/8"
              >
                <Lock size={14} />
                {t("pos.lock_pos")}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FAB circle — animates Lock ↔ X */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => setMobileExpanded((v) => !v)}
          className="w-11 h-11 rounded-full bg-dark/90 flex items-center justify-center shadow-xl border border-white/10 overflow-hidden"
        >
          <AnimatePresence mode="wait" initial={false}>
            {mobileExpanded ? (
              <motion.span
                key="x-icon"
                initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.18 }}
              >
                <X size={18} className="text-white" />
              </motion.span>
            ) : (
              <motion.span
                key="lock-icon"
                initial={{ rotate: 90, opacity: 0, scale: 0.6 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: -90, opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.18 }}
              >
                <Lock size={16} className="text-white" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </>
  );
}

function DockPosButton({
  icon, label, onClick, danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors",
        danger
          ? "text-red-400 hover:text-red-300 hover:bg-red-500/12"
          : "text-white/70 hover:text-white hover:bg-white/10"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
