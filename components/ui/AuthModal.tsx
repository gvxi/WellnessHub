"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, Mail, Lock, Phone, User, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { supabase } from "@/lib/supabase/client";
import { useUI } from "@/lib/shop-context";
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
      Continue with Google
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
}: {
  icon: React.ElementType;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}) {
  return (
    <div className="relative">
      <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark/30 pointer-events-none" />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-dark/[0.04] border border-dark/8
                   text-sm text-dark placeholder:text-dark/35 outline-none
                   focus:border-primary/40 focus:bg-primary/[0.03] transition-all"
      />
    </div>
  );
}

function SignInTab({ onSwitch, onSuccess }: { onSwitch: () => void; onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const showPassword = email.trim().length > 0;

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
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <GoogleButton onClick={handleGoogle} />
      <Divider />
      <InputField icon={Mail} type="email" placeholder="Email address" value={email} onChange={setEmail} autoComplete="email" />
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
            <InputField icon={Lock} type="password" placeholder="Password" value={password} onChange={setPassword} autoComplete="current-password" />
          </motion.div>
        )}
      </AnimatePresence>
      {error && <p className="text-xs text-red-500 px-1">{error}</p>}
      <motion.button
        type="submit"
        whileTap={{ scale: 0.97 }}
        disabled={!email || !password || loading}
        className={cn(
          "w-full py-3 rounded-2xl text-sm font-semibold transition-colors",
          email && password && !loading
            ? "bg-primary text-light hover:bg-primary/90"
            : "bg-dark/8 text-dark/30 cursor-not-allowed"
        )}
      >
        {loading ? "Signing in…" : "Sign In"}
      </motion.button>
      <p className="text-center text-xs text-dark/40 pt-1">
        No account?{" "}
        <button type="button" onClick={onSwitch} className="text-primary font-semibold hover:underline">
          Sign up
        </button>
      </p>
    </form>
  );
}

function SignUpTab({ onSuccess }: { onSuccess: () => void }) {
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
      <InputField icon={Mail} type="email" placeholder="Email address" value={email} onChange={setEmail} autoComplete="email" />
      <InputField icon={Lock} type="password" placeholder="Password (min 6 chars)" value={password} onChange={setPassword} autoComplete="new-password" />
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
        {loading ? "Creating account…" : "Create Account"}
      </motion.button>
    </form>
  );
}

function ProfileStep({ onDone }: { onDone: () => void }) {
  const [username, setUsername] = useState("");
  const [dialCode, setDialCode] = useState("+968");
  const [phoneNum, setPhoneNum] = useState("");
  const [age, setAge] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").upsert({
        id: user.id,
        username: username || null,
        phone: phoneNum ? `${dialCode}${phoneNum}` : null,
        age: age ? parseInt(age) : null,
      });
    }
    setSaving(false);
    onDone();
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-3">
      <div className="relative">
        <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark/30 pointer-events-none" />
        <input
          type="text"
          placeholder="Username (optional)"
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
            placeholder="Phone number"
            value={phoneNum}
            onChange={(e) => setPhoneNum(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-dark/[0.04] border border-dark/8
                       text-sm text-dark placeholder:text-dark/35 outline-none
                       focus:border-primary/40 focus:bg-primary/[0.03] transition-all"
          />
        </div>
      </div>

      <div className="relative">
        <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark/30 pointer-events-none" />
        <input
          type="number"
          placeholder="Age"
          min={13}
          max={120}
          value={age}
          onChange={(e) => setAge(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-dark/[0.04] border border-dark/8
                     text-sm text-dark placeholder:text-dark/35 outline-none
                     focus:border-primary/40 focus:bg-primary/[0.03] transition-all"
        />
      </div>

      <motion.button
        type="submit"
        whileTap={{ scale: 0.97 }}
        disabled={saving}
        className="w-full py-3 rounded-2xl text-sm font-semibold bg-primary text-light
                   hover:bg-primary/90 transition-colors disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save Profile"}
      </motion.button>
    </form>
  );
}

export default function AuthModal() {
  const { authOpen, setAuthOpen, authStep, setAuthStep } = useUI();

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
                    {isProfile ? "Complete your profile" : tab === "signin" ? "Welcome back" : "Create account"}
                  </h2>
                  <p className="text-xs text-dark/40 mt-0.5">
                    {isProfile ? "You can update this anytime" : "WellnessHub · Members area"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isProfile && (
                    <button
                      onClick={close}
                      className="text-xs text-dark/40 hover:text-dark/70 font-medium transition-colors px-2"
                    >
                      Skip
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
                  {(["signin", "signup"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setAuthStep(t)}
                      className={cn(
                        "flex-1 py-2 rounded-xl text-xs font-semibold transition-all duration-200",
                        tab === t ? "bg-light text-dark shadow-sm" : "text-dark/45 hover:text-dark/70"
                      )}
                    >
                      {t === "signin" ? "Sign In" : "Sign Up"}
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
