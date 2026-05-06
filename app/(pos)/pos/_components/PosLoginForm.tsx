"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff } from "lucide-react";

export default function PosLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/pos/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }

      router.push("/pos/dashboard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2.5 text-center">
          {error}
        </p>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-dark/55">Email</label>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-dark/5 rounded-xl px-4 py-3 text-sm text-dark outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="employee@wellnesshub.com"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-dark/55">Password</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-dark/5 rounded-xl px-4 py-3 pe-11 text-sm text-dark outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 end-3 flex items-center text-dark/40"
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 mt-2 rounded-2xl bg-primary text-light text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading && <Loader2 size={15} className="animate-spin" />}
        Sign in
      </button>
    </form>
  );
}
