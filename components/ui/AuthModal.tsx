"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, Mail, Lock, Phone, User, Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { supabase } from "@/lib/supabase/client";
import { useUI } from "@/lib/shop-context";
import { useLang } from "@/lib/lang-context";
import { cn } from "@/lib/utils";

const SPRING = { type: "spring" as const, stiffness: 300, damping: 28 };

const COUNTRIES = [
  { code: "OM", flag: "🇴🇲", dial: "+968", name: "Oman" },
  { code: "AE", flag: "🇦🇪", dial: "+971", name: "UAE" },
  { code: "SA", flag: "🇸🇦", dial: "+966", name: "Saudi Arabia" },
  { code: "KW", flag: "🇰🇼", dial: "+965", name: "Kuwait" },
  { code: "BH", flag: "🇧🇭", dial: "+973", name: "Bahrain" },
  { code: "QA", flag: "🇶🇦", dial: "+974", name: "Qatar" },
  { code: "EG", flag: "🇪🇬", dial: "+20", name: "Egypt" },
  { code: "JO", flag: "🇯🇴", dial: "+962", name: "Jordan" },
  { code: "LB", flag: "🇱🇧", dial: "+961", name: "Lebanon" },
  { code: "IN", flag: "🇮🇳", dial: "+91", name: "India" },
  { code: "PK", flag: "🇵🇰", dial: "+92", name: "Pakistan" },
  { code: "PH", flag: "🇵🇭", dial: "+63", name: "Philippines" },
  { code: "BD", flag: "🇧🇩", dial: "+880", name: "Bangladesh" },
  { code: "GB", flag: "🇬🇧", dial: "+44", name: "UK" },
  { code: "US", flag: "🇺🇸", dial: "+1", name: "USA" },
  { code: "FR", flag: "🇫🇷", dial: "+33", name: "France" },
  { code: "DE", flag: "🇩🇪", dial: "+49", name: "Germany" },
  { code: "TR", flag: "🇹🇷", dial: "+90", name: "Turkey" },
  { code: "IR", flag: "🇮🇷", dial: "+98", name: "Iran" },
  { code: "NG", flag: "🇳🇬", dial: "+234", name: "Nigeria" },
];

function GoogleButton({ onClick }: { onClick: () => void }) {
  const { t } = useLang();
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl
                 border border-dark/12 hover:border-dark/20 hover:bg-dark/[0.03]
                 transition-all duration-200 text-sm font-medium text-dark/80"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
        <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
      </svg>
      {t("auth.google")}
    </button>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px bg-dark/10" />
      <span className="text-xs text-dark/30 font-medium">or</span>
      <div className="flex-1 h-px bg-dark/10" />
    </div>
  );
}

function InputField({
  icon: Icon,
  type,
  placeholder,
  value,
  onChange,
  autoComplete,
  showToggle,
}: {
  icon: React.ElementType;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  showToggle?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const resolvedType = showToggle && type === "password" ? (visible ? "text" : "password") : type;

  return (
    <div className="relative">
      <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark/30 pointer-events-none" />
      <input
        type={resolvedType}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className="w-full pl-10 pr-10 py-3 rounded-2xl bg-dark/[0.04] border border-dark/8
                   text-sm text-dark placeholder:text-dark/35 outline-none
                   focus:border-primary/40 focus:bg-primary/[0.03] transition-all"
      />
      {showToggle && type === "password" && (
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark/30 hover:text-dark/60 transition-colors"
        >
          {visible ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      )}
    </div>
  );
}

function SignInTab({ onSwitch, onSuccess }: { onSwitch: () => void; onSuccess: () => void }) {
  const { t } = useLang();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [sent, setSent] = useState(false);
  const showPassword = mode === "password" && email.trim().length > 0;

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: typeof window !== "undefined" ? window.location.href : "/" },
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    if (mode === "magic") {
      const { error: err } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      setLoading(false);
      if (err) { setError(err.message); return; }
      setSent(true);
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (err) { setError(err.message); return; }
      onSuccess();
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Mail size={22} className="text-primary" />
        </div>
        <p className="text-sm font-semibold text-dark">{t("auth.magicLinkSent")}</p>
        <p className="text-xs text-dark/50 max-w-[260px]">{t("auth.magicLinkHint")}</p>
        <button
          type="button"
          onClick={() => { setSent(false); setMode("password"); }}
          className="text-xs text-primary font-semibold hover:underline mt-1"
        >
          {t("auth.usePassword")}
        </button>
      </div>
    );
  }

  const canSubmit = mode === "magic" ? !!email && !loading : !!email && !!password && !loading;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <GoogleButton onClick={handleGoogle} />
      <Divider />
      <InputField icon={Mail} type="email" placeholder={t("auth.emailPlaceholder")} value={email} onChange={setEmail} autoComplete="email" />
      <AnimatePresence>
        {showPassword && (
          <motion.div
            key="password"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: "hidden" }}
          >
            <InputField icon={Lock} type="password" placeholder={t("auth.passwordPlaceholder")} value={password} onChange={setPassword} autoComplete="current-password" showToggle />
          </motion.div>
        )}
      </AnimatePresence>
      {error && <p className="text-xs text-red-500 px-1">{error}</p>}
      <motion.button
        type="submit"
        whileTap={{ scale: 0.97 }}
        disabled={!canSubmit}
        className={cn(
          "w-full py-3 rounded-2xl text-sm font-semibold transition-colors",
          canSubmit
            ? "bg-primary text-light hover:bg-primary/90"
            : "bg-dark/8 text-dark/30 cursor-not-allowed"
        )}
      >
        {loading
          ? (mode === "magic" ? t("auth.sendingLink") : t("auth.signingIn"))
          : (mode === "magic" ? t("auth.sendLink") : t("auth.signIn"))}
      </motion.button>
      {email.trim().length > 0 && (
        <button
          type="button"
          onClick={() => { setMode((m) => m === "magic" ? "password" : "magic"); setError(""); }}
          className="text-center text-xs text-dark/40 hover:text-primary transition-colors"
        >
          {mode === "magic" ? t("auth.usePassword") : t("auth.useMagicLink")}
        </button>
      )}
      <p className="text-center text-xs text-dark/40 pt-1">
        {t("auth.noAccount")}{" "}
        <button type="button" onClick={onSwitch} className="text-primary font-semibold hover:underline">
          {t("auth.signUp")}
        </button>
      </p>
    </form>
  );
}

function SignUpTab({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useLang();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: err } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    onSuccess();
  }

  const canSubmit = email && password.length >= 6 && (siteKey ? !!token : true) && !loading;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <InputField icon={Mail} type="email" placeholder={t("auth.emailPlaceholder")} value={email} onChange={setEmail} autoComplete="email" />
      <InputField icon={Lock} type="password" placeholder={t("auth.passwordHint")} value={password} onChange={setPassword} autoComplete="new-password" showToggle />
      {siteKey && (
        <div className="flex justify-center">
          <Turnstile siteKey={siteKey} onSuccess={setToken} />
        </div>
      )}
      {error && <p className="text-xs text-red-500 px-1">{error}</p>}
      <motion.button
        type="submit"
        whileTap={{ scale: 0.97 }}
        disabled={!canSubmit}
        className={cn(
          "w-full py-3 rounded-2xl text-sm font-semibold transition-colors",
          canSubmit
            ? "bg-primary text-light hover:bg-primary/90"
            : "bg-dark/8 text-dark/30 cursor-not-allowed"
        )}
      >
        {loading ? t("auth.creating") : t("auth.createAccount")}
      </motion.button>
    </form>
  );
}

function ReadonlyRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-3 px-3 rounded-2xl bg-dark/[0.03] border border-dark/8">
      <Icon size={15} className="text-dark/30 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-dark/35 uppercase tracking-wider font-medium">{label}</p>
        <p className="text-sm text-dark font-medium truncate">{value || "—"}</p>
      </div>
    </div>
  );
}

function ProfileStep({ onDone }: { onDone: () => void }) {
  const { t } = useLang();
  const [username, setUsername] = useState("");
  const [dialCode, setDialCode] = useState("+968");
  const [phoneNum, setPhoneNum] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); setEditing(true); return; }
      const { data } = await supabase.from("profiles").select("username, phone, age").eq("id", user.id).single();
      if (data) {
        setUsername(data.username ?? "");
        if (data.phone) {
          const match = COUNTRIES.find((c) => data.phone!.startsWith(c.dial));
          if (match) {
            setDialCode(match.dial);
            setPhoneNum(data.phone.slice(match.dial.length));
          } else {
            setPhoneNum(data.phone);
          }
        }
        const hasData = !!(data.username || data.phone);
        setEditing(!hasData);
      } else {
        setEditing(true);
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").upsert({
        id: user.id,
        username: username || null,
        phone: phoneNum ? `${dialCode}${phoneNum}` : null,
        age: 20,
      });
    }
    setSaving(false);
    setEditing(false);
  }

  if (loading) {
    return <div className="flex justify-center py-8"><div className="w-5 h-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" /></div>;
  }

  if (!editing) {
    return (
      <div className="flex flex-col gap-2">
        <ReadonlyRow icon={User} label={t("auth.usernamePlaceholder")} value={username} />
        <ReadonlyRow icon={Phone} label={t("auth.phonePlaceholder")} value={phoneNum ? `${dialCode} ${phoneNum}` : ""} />
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setEditing(true)}
          className="w-full py-3 mt-1 rounded-2xl text-sm font-semibold bg-primary text-light
                     hover:bg-primary/90 transition-colors"
        >
          {t("auth.editProfile")}
        </motion.button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-3">
      <div className="relative">
        <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark/30 pointer-events-none" />
        <input
          type="text"
          placeholder={t("auth.usernamePlaceholder")}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-dark/[0.04] border border-dark/8
                     text-sm text-dark placeholder:text-dark/35 outline-none
                     focus:border-primary/40 focus:bg-primary/[0.03] transition-all"
        />
      </div>

      <div className="flex gap-2">
        <select
          value={dialCode}
          onChange={(e) => setDialCode(e.target.value)}
          className="py-3 px-2 rounded-2xl bg-dark/[0.04] border border-dark/8
                     text-sm text-dark outline-none focus:border-primary/40 transition-all shrink-0"
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.dial}>
              {c.flag} {c.dial}
            </option>
          ))}
        </select>
        <div className="relative flex-1">
          <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark/30 pointer-events-none" />
          <input
            type="tel"
            placeholder={t("auth.phonePlaceholder")}
            value={phoneNum}
            onChange={(e) => setPhoneNum(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-dark/[0.04] border border-dark/8
                       text-sm text-dark placeholder:text-dark/35 outline-none
                       focus:border-primary/40 focus:bg-primary/[0.03] transition-all"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => setEditing(false)}
          className="flex-1 py-3 rounded-2xl text-sm font-semibold bg-dark/[0.06] text-dark/60
                     hover:bg-dark/10 transition-colors"
        >
          {t("auth.cancel")}
        </motion.button>
        <motion.button
          type="submit"
          whileTap={{ scale: 0.97 }}
          disabled={saving}
          className="flex-1 py-3 rounded-2xl text-sm font-semibold bg-primary text-light
                     hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {saving ? t("auth.saving") : t("auth.save")}
        </motion.button>
      </div>
    </form>
  );
}

export default function AuthModal() {
  const { authOpen, setAuthOpen, authStep, setAuthStep } = useUI();
  const { t } = useLang();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setAuthOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [setAuthOpen]);

  useEffect(() => {
    document.body.style.overflow = authOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [authOpen]);

  function close() { setAuthOpen(false); }

  const isProfile = authStep === "profile";
  const tab = authStep === "signup" ? "signup" : "signin";

  return (
    <AnimatePresence>
      {authOpen && (
        <>
          <motion.div
            key="auth-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-dark/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={close}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              key="auth-panel"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={SPRING}
              className="w-full max-w-[420px] bg-light rounded-3xl shadow-2xl px-6 py-7 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold text-dark">
                    {isProfile ? t("auth.completeProfile") : tab === "signin" ? t("auth.welcomeBack") : t("auth.createAccount")}
                  </h2>
                  <p className="text-xs text-dark/40 mt-0.5">
                    {isProfile ? t("auth.updateAnytime") : t("auth.membersArea")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isProfile && (
                    <button
                      onClick={close}
                      className="text-xs text-dark/40 hover:text-dark/70 font-medium transition-colors px-2"
                    >
                      {t("auth.skip")}
                    </button>
                  )}
                  <button
                    onClick={close}
                    aria-label="Close"
                    className="w-8 h-8 rounded-full flex items-center justify-center
                               hover:bg-dark/8 transition-colors text-dark/40 hover:text-dark"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Tab switcher (signin/signup only) */}
              {!isProfile && (
                <div className="flex gap-1 bg-dark/[0.04] rounded-2xl p-1 mb-5">
                  {(["signin", "signup"] as const).map((tabKey) => (
                    <button
                      key={tabKey}
                      onClick={() => setAuthStep(tabKey)}
                      className={cn(
                        "flex-1 py-2 rounded-xl text-xs font-semibold transition-all duration-200",
                        tab === tabKey ? "bg-light text-dark shadow-sm" : "text-dark/45 hover:text-dark/70"
                      )}
                    >
                      {tabKey === "signin" ? t("auth.signIn") : t("auth.signUp")}
                    </button>
                  ))}
                </div>
              )}

              {/* Content */}
              <AnimatePresence mode="wait">
                {isProfile ? (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                  >
                    <ProfileStep onDone={close} />
                  </motion.div>
                ) : tab === "signin" ? (
                  <motion.div
                    key="signin"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                  >
                    <SignInTab onSwitch={() => setAuthStep("signup")} onSuccess={() => setAuthStep("profile")} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="signup"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                  >
                    <SignUpTab onSuccess={() => setAuthStep("profile")} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
