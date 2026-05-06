"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type LogEntry = { time: string; msg: string; kind: "info" | "warn" | "err" | "sdk" };
type Mode = "iframe" | "direct";

function stamp() {
  return new Date().toISOString().slice(11, 23);
}

export default function TestPixelPage() {
  const [mode, setMode] = useState<Mode>("iframe");
  const [cs, setCs] = useState("");
  const [pk, setPk] = useState("");
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const [iframeHeight, setIframeHeight] = useState(520);
  const [fetching, setFetching] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([
    { time: stamp(), msg: "Ready — click (Auto-fetch CS) (must be logged in) or paste CS + PK manually", kind: "info" },
  ]);
  const [initCount, setInitCount] = useState(0);
  const [cardValid, setCardValid] = useState(false);
  const [payTriggered, setPayTriggered] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const directInitRef = useRef(false);

  function push(msg: string, kind: LogEntry["kind"] = "info") {
    setLogs((prev) => [...prev, { time: stamp(), msg, kind }]);
  }

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // iframe postMessage listener
  useEffect(() => {
    if (!iframeSrc) return;
    function handle(e: MessageEvent) {
      if (!e.data?.type) return;
      const { type, height, bookingId } = e.data as Record<string, unknown>;
      if (type === "RESIZE" && typeof height === "number") {
        setIframeHeight(Math.max(520, (height as number) + 20));
        push(`RESIZE → ${height}px`, "sdk");
      } else if (type === "CARD_VALID") {
        const valid = !!(e.data as Record<string, unknown>).isValid;
        setCardValid(valid);
        setPayTriggered(false);
        push(`CARD_VALID → ${valid}`, valid ? "sdk" : "warn");
      } else if (type === "PAYMENT_SUCCESS") {
        push(`PAYMENT_SUCCESS — bookingId: ${bookingId}`, "sdk");
        setCardValid(false);
        setPayTriggered(false);
      } else if (type === "PAYMENT_CANCEL") {
        push("PAYMENT_CANCEL", "sdk");
        setCardValid(false);
        setPayTriggered(false);
      } else if (type === "CSS_LOADED") {
        const { count, hrefs } = e.data as { count: number; hrefs: string[] };
        push(`CSS_LOADED — ${count} Paymob link(s) confirmed`, count > 0 ? "sdk" : "warn");
        (hrefs ?? []).forEach((h: string) => push(`  └ ${h}`, "sdk"));
      } else if (type === "PIXEL_ERROR") {
        push(`PIXEL_ERROR — ${(e.data as Record<string, string>).msg}`, "err");
      } else {
        push(`[msg] ${JSON.stringify(e.data)}`, "sdk");
      }
    }
    window.addEventListener("message", handle);
    return () => window.removeEventListener("message", handle);
  }, [iframeSrc]);

  // Force repaint after iframe loads
  useEffect(() => {
    if (!iframeSrc || !iframeRef.current) return;
    const frame = iframeRef.current;
    function forceRepaint() {
      frame.style.opacity = "0.99";
      requestAnimationFrame(() => { frame.style.opacity = ""; });
    }
    frame.addEventListener("load", forceRepaint);
    return () => frame.removeEventListener("load", forceRepaint);
  }, [iframeSrc]);

  // Direct SDK init via webpack import (sets window.Pixel as side effect)
  useEffect(() => {
    if (mode !== "direct" || !cs || !pk) return;
    if (directInitRef.current) return;
    directInitRef.current = true;

    push("Direct mode — importing paymob-pixel via webpack...", "info");

    // Inject CSS
    if (!document.getElementById("paymob-pixel-css")) {
      const link = document.createElement("link");
      link.id = "paymob-pixel-css";
      link.rel = "stylesheet";
      link.href = "/paymob-pixel.css";
      document.head.appendChild(link);

      const styles = document.createElement("link");
      styles.id = "paymob-pixel-styles-css";
      styles.rel = "stylesheet";
      styles.href = "/paymob-pixel-styles.css";
      document.head.appendChild(styles);
      push("CSS injected from /public", "sdk");
    }

    import("paymob-pixel").then(() => {
      const Pixel = (window as unknown as Record<string, unknown>).Pixel;
      if (typeof Pixel !== "function") {
        push("window.Pixel not a function after import — SDK failed", "err");
        return;
      }
      push("window.Pixel found — initializing...", "sdk");

      new (Pixel as new (opts: unknown) => unknown)({
        publicKey: pk,
        clientSecret: cs,
        paymentMethods: ["card"],
        elementId: "paymob-checkout-container",
        showSaveCard: false,
        forceSaveCard: false,
        customStyle: {
          Font_Family: "Outfit, system-ui, sans-serif",
          Font_Size_Label: "13px",
          Font_Size_Input_Fields: "15px",
          Font_Size_Payment_Button: "15px",
          Font_Weight_Label: 600,
          Font_Weight_Input_Fields: 400,
          Font_Weight_Payment_Button: 600,
          Color_Container: "#F2EDEE",
          Color_Input_Fields: "#FFFFFF",
          Color_Border_Input_Fields: "#DDD5D7",
          Color_Border_Payment_Button: "#5A0F1B",
          Radius_Border: "12px",
          Color_Disabled: "#C9B8BB",
          Color_Error: "#CC1142",
          Color_Primary: "#5A0F1B",
          Text_Color_For_Label: "#0E0B0D",
          Text_Color_For_Payment_Button: "#F2EDEE",
          Text_Color_For_Input_Fields: "#0E0B0D",
          Color_For_Text_Placeholder: "#9B8A8D",
          Width_of_Container: "100%",
          Vertical_Padding: "10px",
          Vertical_Spacing_between_components: "12px",
          Container_Padding: "0px",
        },
        cardValidationChanged: (isValid: boolean) => {
          setCardValid(isValid);
          push(`cardValidationChanged → ${isValid}`, isValid ? "sdk" : "warn");
        },
        afterPaymentComplete: (response: unknown) => {
          push(`afterPaymentComplete — ${JSON.stringify(response)}`, "sdk");
        },
        onPaymentCancel: () => {
          push("onPaymentCancel", "sdk");
        },
      });

      push("Pixel initialized", "sdk");
    }).catch((err) => {
      push(`import error: ${err}`, "err");
    });

    return () => { directInitRef.current = false; };
  }, [mode, cs, pk]);

  async function autoFetch() {
    setFetching(true);
    push("Getting Supabase session...");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        push("Not logged in — go to localhost:3000, sign in, then come back here", "err");
        return;
      }
      push(`Logged in as ${session.user.email} — calling /api/checkout/initiate...`);

      const ray = `test-pixel-${crypto.randomUUID()}`;
      const res = await fetch("/api/checkout/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          items: [{
            id: "test-item",
            qty: 1,
            snapshot: { name: "Test Item", nameAr: "عنصر اختبار", groupLabel: "Test", numericPrice: 5 },
          }],
          subtotal: 5,
          ray_id: ray,
        }),
      });

      push(`HTTP ${res.status} ${res.statusText}`);
      const rawText = await res.text();
      push(`Raw: ${rawText.slice(0, 400)}`);

      let data: Record<string, unknown>;
      try {
        data = JSON.parse(rawText);
      } catch {
        push("Non-JSON response — see Raw above", "err");
        return;
      }

      if (data.client_secret) {
        directInitRef.current = false;
        setCs(data.client_secret as string);
        setPk((data.public_key as string) ?? "");
        push(`CS set (${(data.client_secret as string).slice(0, 20)}...) — click Load`, "sdk");
      } else if (data.error) {
        push(`Edge error: ${data.error} — ${JSON.stringify(data)}`, "err");
      } else {
        push(`No client_secret — full response: ${JSON.stringify(data)}`, "err");
      }
    } catch (e) {
      push(`Fetch failed: ${e}`, "err");
    } finally {
      setFetching(false);
    }
  }

  function load() {
    if (!cs.trim() || !pk.trim()) {
      push("Fill in CS and PK first (or click Auto-fetch CS)", "err");
      return;
    }
    const count = initCount + 1;
    setInitCount(count);
    setIframeHeight(520);
    const src = `/api/pay?cs=${encodeURIComponent(cs.trim())}&pk=${encodeURIComponent(pk.trim())}&bid=TEST_${count}&lang=en`;
    push(`Load #${count} — setting iframe src`);
    setIframeSrc(src);
  }

  function reload() {
    if (!cs.trim() || !pk.trim()) return;
    const count = initCount + 1;
    setInitCount(count);
    setIframeHeight(520);
    const src = `/api/pay?cs=${encodeURIComponent(cs.trim())}&pk=${encodeURIComponent(pk.trim())}&bid=TEST_${count}&lang=en`;
    push(`Reload #${count}`);
    setIframeSrc(src);
  }

  function inspectShadow() {
    const frame = iframeRef.current;
    if (!frame) { push("No iframe element", "err"); return; }
    const doc = frame.contentDocument;
    if (!doc) { push("contentDocument null — cross-origin or not loaded", "err"); return; }
    const el = doc.getElementById("paymob-elements");
    if (!el) { push("#paymob-elements not found in iframe doc", "err"); return; }
    push(`#paymob-elements innerHTML length: ${el.innerHTML.length}`);
    push(`#paymob-elements childElementCount: ${el.childElementCount}`);
    const shadow = el.shadowRoot;
    if (!shadow) { push("No shadowRoot on #paymob-elements — SDK may not have initialized", "warn"); return; }
    push(`shadowRoot children: ${shadow.childElementCount}`);
    const links = Array.from(shadow.querySelectorAll("link[rel='stylesheet']"));
    if (links.length === 0) {
      push("No <link> stylesheets in shadow root", "warn");
    } else {
      links.forEach((l) => {
        const link = l as HTMLLinkElement;
        push(`CSS link: ${link.href} — sheet: ${link.sheet ? "LOADED" : "NULL (failed or pending)"}`, link.sheet ? "sdk" : "err");
      });
    }
    const styles = shadow.querySelectorAll("style");
    push(`<style> tags in shadow root: ${styles.length}`);
    const inner = shadow.firstElementChild as HTMLElement | null;
    if (inner) {
      const computed = doc.defaultView?.getComputedStyle(inner);
      push(`Shadow root first child tag: ${inner.tagName}, display: ${computed?.display}`);
    }
  }

  function clear() {
    setIframeSrc(null);
    setInitCount(0);
    setIframeHeight(520);
    setCardValid(false);
    setPayTriggered(false);
    directInitRef.current = false;
    push("Cleared");
  }

  function triggerPay() {
    if (!cardValid || payTriggered) return;
    setPayTriggered(true);
    iframeRef.current?.contentWindow?.postMessage(
      { type: "TRIGGER_PAY" },
      window.location.origin
    );
    push("TRIGGER_PAY sent → iframe", "sdk");
  }

  const kindColor: Record<LogEntry["kind"], string> = {
    info: "#ccc",
    warn: "#facc15",
    err:  "#f87171",
    sdk:  "#4ade80",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F2EDEE", fontFamily: "'Outfit', sans-serif", padding: "24px" }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0E0B0D", marginBottom: 16 }}>
        Pixel SDK — Local Test
      </h1>

      {/* Mode toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {(["iframe", "direct"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); clear(); }}
            style={{
              ...btnStyle(m === mode ? "#5A0F1B" : "#888"),
              padding: "6px 18px",
              fontSize: 12,
              opacity: m === mode ? 1 : 0.6,
            }}
          >
            {m === "iframe" ? "iframe (/api/pay)" : "direct (webpack import)"}
          </button>
        ))}
        <span style={{ fontSize: 11, color: "#888", alignSelf: "center", marginLeft: 8 }}>
          {mode === "direct" ? "import('paymob-pixel') → window.Pixel via webpack" : "raw HTML API route → plain <script>"}
        </span>
      </div>

      {/* Step 1 — auto-fetch */}
      <div style={{ background: "#fff", border: "1px solid #DDD5D7", borderRadius: 12, padding: "14px 18px", marginBottom: 16, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#5A0F1B", marginBottom: 2 }}>Step 1 — get client secret</div>
          <div style={{ fontSize: 12, color: "#888" }}>Calls /api/checkout/initiate with a dummy 5 OMR item using your logged-in session. Must be signed in at localhost:3000 first.</div>
        </div>
        <button onClick={autoFetch} disabled={fetching} style={btnStyle("#5A0F1B", fetching)}>
          {fetching ? "Fetching..." : "Auto-fetch CS"}
        </button>
      </div>

      {/* Step 2 — manual inputs */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 12, alignItems: "flex-end" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#5A0F1B" }}>Client Secret (cs)</label>
          <input
            value={cs}
            onChange={(e) => setCs(e.target.value)}
            placeholder="cs_xxx... (auto-filled above)"
            style={{ width: 340, padding: "8px 12px", border: "1px solid #DDD5D7", borderRadius: 10, fontSize: 13, fontFamily: "inherit", background: "#fff" }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#5A0F1B" }}>Public Key (pk)</label>
          <input
            value={pk}
            onChange={(e) => setPk(e.target.value)}
            placeholder="are_pk_xxx... (auto-filled above)"
            style={{ width: 300, padding: "8px 12px", border: "1px solid #DDD5D7", borderRadius: 10, fontSize: 13, fontFamily: "inherit", background: "#fff" }}
          />
        </div>
        {mode === "iframe" && (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={load} style={btnStyle("#5A0F1B")}>Load iframe</button>
            <button onClick={reload} disabled={!iframeSrc} style={btnStyle("#7a1826", !iframeSrc)}>Reload</button>
            <button onClick={clear} style={btnStyle("#666")}>Clear</button>
            <button onClick={inspectShadow} disabled={!iframeSrc} style={btnStyle("#2563eb", !iframeSrc)}>Inspect shadow</button>
          </div>
        )}
        {mode === "direct" && (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => { directInitRef.current = false; setCs((v) => v); }}
              disabled={!cs || !pk}
              style={btnStyle("#5A0F1B", !cs || !pk)}
            >
              Re-init SDK
            </button>
            <button onClick={clear} style={btnStyle("#666")}>Clear</button>
          </div>
        )}
      </div>

      {mode === "iframe" && (
        <div style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>
          Total iframe loads:{" "}
          <strong style={{ color: initCount > 1 ? "#f87171" : "#4ade80" }}>{initCount}</strong>
          {initCount > 1 && <span style={{ color: "#f87171" }}>  ← double-init detected</span>}
        </div>
      )}

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>

        {/* Left — form */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #DDD5D7", overflow: "hidden" }}>
          {mode === "iframe" ? (
            <>
              <div style={{ padding: "10px 16px", borderBottom: "1px solid #DDD5D7", fontSize: 11, color: "#888", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {iframeSrc ? iframeSrc : "No iframe loaded"}
              </div>
              {iframeSrc ? (
                <>
                  <iframe
                    ref={iframeRef}
                    key={iframeSrc}
                    src={iframeSrc}
                    style={{ width: "100%", height: `${iframeHeight}px`, border: "none", display: "block" }}
                    allow="payment"
                    title="Pixel SDK Test"
                    onLoad={() => push("iframe onLoad fired")}
                  />
                  <div style={{ padding: "8px 16px 16px" }}>
                    <div style={{ fontSize: 11, color: "#888", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                      Card valid:
                      <span style={{ fontWeight: 700, color: cardValid ? "#4ade80" : "#f87171" }}>
                        {cardValid ? "YES ✓" : "NO ✗"}
                      </span>
                      {payTriggered && <span style={{ color: "#facc15" }}> · pay triggered</span>}
                    </div>
                    <button
                      onClick={triggerPay}
                      disabled={!cardValid || payTriggered}
                      style={btnStyle(cardValid && !payTriggered ? "#5A0F1B" : "#ccc", !cardValid || payTriggered)}
                    >
                      {payTriggered ? "Processing…" : "Pay Now (custom button)"}
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ height: 520, display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa", fontSize: 14 }}>
                  Press (Load iframe)
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ padding: "10px 16px", borderBottom: "1px solid #DDD5D7", fontSize: 11, color: "#888", fontFamily: "monospace" }}>
                direct — import(&apos;paymob-pixel&apos;) → window.Pixel
              </div>
              <div style={{ padding: 16 }}>
                {cs && pk ? (
                  <>
                    <div id="paymob-checkout-container" style={{ minHeight: 400 }} />
                    <div style={{ fontSize: 11, color: "#888", marginTop: 12, display: "flex", alignItems: "center", gap: 6 }}>
                      Card valid:
                      <span style={{ fontWeight: 700, color: cardValid ? "#4ade80" : "#f87171" }}>
                        {cardValid ? "YES ✓" : "NO ✗"}
                      </span>
                    </div>
                  </>
                ) : (
                  <div style={{ height: 400, display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa", fontSize: 14, flexDirection: "column", gap: 8 }}>
                    <span>Auto-fetch CS first</span>
                    <span style={{ fontSize: 12 }}>then paste CS + PK above</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right — log + CSS leak */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          <div style={{ background: "#0E0B0D", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "8px 14px", borderBottom: "1px solid #333", fontSize: 11, color: "#888", display: "flex", justifyContent: "space-between" }}>
              <span>postMessage log</span>
              <button onClick={() => setLogs([])} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 11 }}>clear</button>
            </div>
            <div style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 11, maxHeight: 300, overflowY: "auto" }}>
              {logs.map((l, i) => (
                <div key={i} style={{ color: kindColor[l.kind], lineHeight: 1.6 }}>
                  <span style={{ opacity: 0.5 }}>[{l.time}]</span>{" "}
                  <span>{l.msg}</span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>

          <CssLeakCheck />
        </div>
      </div>
    </div>
  );
}

function CssLeakCheck() {
  const [results, setResults] = useState<Array<{ el: string; cls: string; display: string; leaked: boolean }>>([]);

  function check() {
    const targets = [
      { id: "__leak_about",  cls: "hidden sm:flex", label: "hidden sm:flex" },
      { id: "__leak_nav",    cls: "hidden md:flex", label: "hidden md:flex" },
      { id: "__leak_plain",  cls: "hidden",         label: "hidden (plain)" },
    ];
    const out: typeof results = [];
    targets.forEach(({ id, cls, label }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const display = getComputedStyle(el).display;
      out.push({ el: label, cls, display, leaked: display === "none" });
    });
    setResults(out);
  }

  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #DDD5D7", overflow: "hidden" }}>
      <div style={{ padding: "10px 16px", borderBottom: "1px solid #EEE", fontSize: 12, fontWeight: 600, color: "#0E0B0D", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        CSS leak detector
        <button onClick={check} style={btnStyle("#5A0F1B")}>Check now</button>
      </div>
      <div style={{ padding: "12px 16px" }}>
        <span id="__leak_about" className="hidden sm:flex" style={{ fontSize: 11, color: "#5A0F1B" }}>About sentinel</span>
        <span id="__leak_nav"   className="hidden md:flex" style={{ fontSize: 11, color: "#5A0F1B" }}>Nav sentinel</span>
        <span id="__leak_plain" className="hidden"         style={{ fontSize: 11, color: "#5A0F1B" }}>Hidden sentinel</span>

        {results.length === 0 ? (
          <p style={{ fontSize: 12, color: "#aaa" }}>Click (Check now) after Pixel SDK loads inside iframe</p>
        ) : (
          <>
            <p style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>
              At viewport ≥640px: <code>hidden sm:flex</code> should be <strong>flex</strong>, not none.
            </p>
            <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Class", "display", "Status"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "4px 8px", borderBottom: "1px solid #EEE", color: "#888" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i}>
                    <td style={{ padding: "4px 8px", fontFamily: "monospace", color: "#666" }}>{r.cls}</td>
                    <td style={{ padding: "4px 8px", fontFamily: "monospace", color: r.leaked ? "#f87171" : "#4ade80" }}>{r.display}</td>
                    <td style={{ padding: "4px 8px", color: r.leaked ? "#f87171" : "#4ade80", fontWeight: 600 }}>{r.leaked ? "LEAKED" : "OK"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
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
    flexShrink: 0,
  };
}
