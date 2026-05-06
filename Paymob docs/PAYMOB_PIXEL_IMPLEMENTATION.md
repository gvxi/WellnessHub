# Paymob Oman — Pixel SDK Implementation Guide

## Context

This documents the correct way to integrate Paymob Oman's Pixel SDK (`paymob-pixel` npm package) in a Next.js 15 app. Several non-obvious issues were discovered during implementation.

---

## 1. Backend — Supabase Edge Function (`checkout-initiate`)

The edge function (`verify_jwt: true`) returns:

```json
{
  "client_secret": "omn_csk_live_...",
  "public_key": "omn_pk_live_...",
  "booking_id": "uuid"
}
```

**Request shape:**
```json
{
  "items": [{ "id": "...", "qty": 1, "snapshot": { "name": "...", "numericPrice": 1.5 } }],
  "subtotal": 1.5,
  "ray_id": "any-string"
}
```

**Auth:** Bearer token from `supabase.auth.signInWithPassword()` — must be a real user with complete `profiles` row (username + phone required).

---

## 2. CORS Fix — Proxy via Next.js API Route

**Problem:** `verify_jwt: true` causes Supabase gateway to reject CORS preflight (OPTIONS has no auth header) before the edge function's own OPTIONS handler runs.

**Fix:** Never call the edge function directly from the browser. Proxy through a Next.js API route:

```ts
// app/api/checkout/initiate/route.ts
import { NextRequest, NextResponse } from "next/server";

const EDGE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL + "/functions/v1/checkout-initiate";

export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const res = await fetch(EDGE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: token },
    body: JSON.stringify(body),
  });

  return NextResponse.json(await res.json(), { status: res.status });
}
```

Browser calls `/api/checkout/initiate` (same origin, no CORS). Proxy calls Supabase server-to-server.

---

## 3. Pixel SDK — Critical Findings

### Install
```bash
npm install paymob-pixel
```

### How the SDK works (non-obvious)

| Approach | Result |
|---|---|
| `import()` dynamic + `mod.Pixel` | `undefined` — no named export |
| `import()` dynamic + `mod.default` | `{}` empty object — no default export |
| CDN `<script src="...">` (no type) | Loads but sets **no** window globals |
| CDN `<script type="module">` | Module runs, no exports accessible |
| `import('paymob-pixel')` via npm | **Side effect sets `window.Pixel`** |

**The SDK is a webpack IIFE bundle with no ES module exports. It sets `window.Pixel` as a global side effect when imported via npm through webpack.**

### CSS

The package exports only `./main.js` in its `exports` field — `paymob-pixel/main.css` throws "not exported" error. Options:
- Copy `node_modules/paymob-pixel/main.css` → `public/paymob-pixel.css` and serve statically
- Or skip CSS for now (form still renders)

### Correct initialization

```tsx
"use client";
import { useEffect } from "react";

useEffect(() => {
  if (!clientSecret || !publicKey) return;

  import("paymob-pixel").then(() => {
    // SDK sets window.Pixel as side effect of import
    const Pixel = (window as any).Pixel;
    if (typeof Pixel !== "function") return;

    new Pixel({
      publicKey,
      clientSecret,
      elementId: "paymob-checkout-container", // id of your div
      paymentMethods: ["card"],               // "card" | "google-pay" | "apple-pay"
      customStyle: { /* see section 4 */ },
    });
  });
}, [clientSecret, publicKey]);

// In JSX:
<div id="paymob-checkout-container" style={{ minHeight: 400 }} />
```

---

## 4. Custom Style Properties

Full list of `customStyle` keys (all optional):

```ts
customStyle: {
  // Typography
  Font_Family: "system-ui, sans-serif",
  Font_Size_Label: "13px",
  Font_Size_Input_Fields: "15px",
  Font_Size_Payment_Button: "16px",
  Font_Weight_Label: 500,           // number
  Font_Weight_Input_Fields: 400,
  Font_Weight_Payment_Button: 600,

  // Colors
  Color_Primary: "#2563eb",          // primary accent (button bg, focus ring)
  Color_Container: "#ffffff",        // form container background
  Color_Input_Fields: "#f9fafb",     // input background
  Color_Border_Input_Fields: "#d1d5db",
  Color_Border_Payment_Button: "#2563eb",
  Color_Error: "#dc2626",
  Color_Disabled: "#9ca3af",

  // Text colors
  Text_Color_For_Label: "#374151",
  Text_Color_For_Input_Fields: "#111827",
  Text_Color_For_Payment_Button: "#ffffff",
  Color_For_Text_Placeholder: "#9ca3af",

  // Layout
  Radius_Border: "8px",
  Width_of_Container: "100%",
  Container_Padding: "0px",
  Vertical_Padding: "10px",
  Vertical_Spacing_between_components: "12px",

  // Toggles
  HideCardIcons: false,   // boolean
  HideCardLabel: false,
  Direction: "ltr",       // "rtl" for Arabic

  // Text overrides (all optional)
  Label_Text: {
    cardLabel: "Card Details",
    savedCardsLabel: "Saved Cards",
    saveCardConsentLabel: "Save card",
    cardEndingLabel: "ending in",
  },
  Placeholder_Text: {
    holderName: "Name on card",
    cardNumber: "Card number",
    expiryDate: "MM / YY",
    securityCode: "CVV",
  },
  Button_Text: {
    payBtn: "Pay Now",
    addNewCardBtn: "Add New Card",
    viewSavedCardsBtn: "Saved Cards",
  },
  Error_Text: { /* field-specific error message overrides */ },
  Hint_Text:  { /* CVV hints, consent hints, etc. */ },
}
```

---

## 5. Callback Options

```ts
new Pixel({
  // ...
  afterPaymentComplete: (response) => {
    console.log("payment done", response);
    // response.status: "success" | "declined" | "pending"
  },
  beforePaymentComplete: () => {
    // custom logic before Paymob processes
  },
  cardValidationChanged: (isValid) => {
    // enable/disable external pay button
  },
  onPaymentCancel: () => {
    // Apple Pay cancelled
  },
});
```

---

## 6. External Pay Button (optional)

Hide SDK's own button and trigger payment from your own UI:

```
you already implmented this
```

---

## 7. Redirect URLs

Edge function sets these in the Paymob intention:
- `notification_url`: `${APP_URL}/api/checkout/callback` — POST webhook from Paymob
- `redirection_url`: `${APP_URL}/checkout/success` — user redirect after payment

Handle the callback route to receive payment status server-side.

---

## 8. HTTPS for Local Dev

```
ignore this
```


---

## 9. Amount

Paymob Oman uses **Baisa** (1 OMR = 1000 baisa). Edge function converts:
```ts
const amountBaisa = Math.round(subtotal * 1000);
```

Minimum order: **1.000 OMR** (enforced server-side unless `DEV_MODE` is set).
