"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function TestPixelPage() {
  const [cs, setCs] = useState("");
  const [pk, setPk] = useState("");
  const [url, setUrl] = useState("");
  const [fetching, setFetching] = useState(false);
  const [log, setLog] = useState<string[]>(["Ready — auto-fetch or paste CS + PK manually"]);

  function push(msg: string) {
    setLog((prev) => [...prev, msg]);
  }

  async function autoFetch() {
    setFetching(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        push("Not logged in — sign in at localhost:3000 first");
        return;
      }
      push(`Logged in as ${session.user.email}`);
      const res = await fetch("/api/checkout/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          items: [{ id: "test-item", qty: 1, snapshot: { name: "Test Item", nameAr: "عنصر اختبار", groupLabel: "Test", numericPrice: 5 } }],
          subtotal: 5,
          ray_id: `test-${crypto.randomUUID()}`,
        }),
      });
      push(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.client_secret) {
        setCs(data.client_secret as string);
        setPk((data.public_key as string) ?? "");
        push(`CS set (${(data.client_secret as string).slice(0, 20)}...) — click Load`);
      } else {
        push(`Error: ${JSON.stringify(data)}`);
      }
    } catch (e) {
      push(`Fetch failed: ${e}`);
    } finally {
      setFetching(false);
    }
  }

  function load() {
    if (!cs.trim() || !pk.trim()) { push("Need CS + PK first"); return; }
    const u = `https://oman.paymob.com/unifiedcheckout/?publicKey=${encodeURIComponent(pk.trim())}&clientSecret=${encodeURIComponent(cs.trim())}`;
    push(`Loading Paymob hosted checkout...`);
    setUrl(u);
  }

  function clear() {
    setCs("");
    setPk("");
    setUrl("");
    setLog(["Cleared"]);
  }

  return (
    <div style={{ padding: 24, fontFamily: "'Outfit', sans-serif", background: "#F2EDEE", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 18, fontWeight: 700, color: "#0E0B0D", marginBottom: 20 }}>
        Paymob — Hosted Checkout Test
      </h1>

      <div style={{ background: "#fff", border: "1px solid #DDD5D7", borderRadius: 12, padding: "14px 18px", marginBottom: 16, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#5A0F1B", marginBottom: 2 }}>Step 1 — get client secret</div>
          <div style={{ fontSize: 12, color: "#888" }}>Calls /api/checkout/initiate with 5 OMR test item. Must be signed in.</div>
        </div>
        <button onClick={autoFetch} disabled={fetching} style={btnStyle("#5A0F1B", fetching)}>
          {fetching ? "Fetching..." : "Auto-fetch CS"}
        </button>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16, alignItems: "flex-end" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#5A0F1B" }}>Client Secret</label>
          <input
            value={cs}
            onChange={(e) => setCs(e.target.value)}
            placeholder="omn_csk_live_... (auto-filled)"
            style={{ width: 340, padding: "8px 12px", border: "1px solid #DDD5D7", borderRadius: 10, fontSize: 13, fontFamily: "inherit", background: "#fff" }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#5A0F1B" }}>Public Key</label>
          <input
            value={pk}
            onChange={(e) => setPk(e.target.value)}
            placeholder="omn_pk_live_... (auto-filled)"
            style={{ width: 300, padding: "8px 12px", border: "1px solid #DDD5D7", borderRadius: 10, fontSize: 13, fontFamily: "inherit", background: "#fff" }}
          />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={load} disabled={!cs || !pk} style={btnStyle("#5A0F1B", !cs || !pk)}>Load</button>
          <button onClick={clear} style={btnStyle("#666")}>Clear</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, alignItems: "start" }}>
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #DDD5D7", overflow: "hidden" }}>
          {url ? (
            <iframe
              key={url}
              src={url}
              style={{ width: "100%", height: 700, border: "none", display: "block" }}
              allow="payment"
              title="Paymob Hosted Checkout"
            />
          ) : (
            <div style={{ height: 700, display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa", fontSize: 14 }}>
              Auto-fetch then Load
            </div>
          )}
        </div>

        <div style={{ background: "#0E0B0D", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "8px 14px", borderBottom: "1px solid #333", fontSize: 11, color: "#888", display: "flex", justifyContent: "space-between" }}>
            <span>log</span>
            <button onClick={() => setLog([])} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 11 }}>clear</button>
          </div>
          <div style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 11, maxHeight: 680, overflowY: "auto" }}>
            {log.map((l, i) => (
              <div key={i} style={{ color: "#4ade80", lineHeight: 1.7 }}>{l}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function btnStyle(bg: string, disabled = false): React.CSSProperties {
  return {
    background: disabled ? "#ccc" : bg,
    color: "#F2EDEE",
    border: "none",
    borderRadius: 8,
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
  };
}
