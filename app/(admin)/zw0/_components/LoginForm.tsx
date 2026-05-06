"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Lock, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/lang-context";

export default function LoginForm() {
  const router = useRouter();
  const { t, isRTL } = useLang();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }

      router.push("/zw0/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4" dir={isRTL ? "rtl" : "ltr"}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mb-4">
            <Lock size={20} className="text-light" />
          </div>
          <h1 className="text-xl font-semibold text-light tracking-tight">{t("admin.login_title")}</h1>
          <p className="text-sm text-light/40 mt-1">{t("admin.login_subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder={t("admin.login_email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className={cn(
              "w-full bg-light/[0.06] text-light placeholder:text-light/30",
              "border border-light/10 rounded-xl px-4 py-3 text-sm",
              "focus:outline-none focus:border-primary/60 focus:bg-light/[0.09]",
              "transition-colors"
            )}
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder={t("admin.login_password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className={cn(
                "w-full bg-light/[0.06] text-light placeholder:text-light/30",
                "border border-light/10 rounded-xl px-4 py-3 text-sm",
                isRTL ? "pl-11" : "pr-11",
                "focus:outline-none focus:border-primary/60 focus:bg-light/[0.09]",
                "transition-colors"
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 text-light/30 hover:text-light/60 transition-colors",
                isRTL ? "left-3.5" : "right-3.5"
              )}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-red-400 px-1"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={cn(
              "w-full bg-primary text-light rounded-xl py-3 text-sm font-semibold",
              "flex items-center justify-center gap-2",
              "hover:bg-primary/90 active:scale-[0.98] transition-all",
              "disabled:opacity-50 disabled:pointer-events-none"
            )}
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                {t("admin.login_signing_in")}
              </>
            ) : (
              t("admin.login_sign_in")
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
