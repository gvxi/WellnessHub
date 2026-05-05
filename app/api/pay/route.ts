import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cs  = searchParams.get("cs")   ?? "";
  const pk  = searchParams.get("pk")   ?? "";
  const bid = searchParams.get("bid")  ?? "";
  const lang = searchParams.get("lang") ?? "en";
  const isRtl = lang === "ar";

  // Values are JSON.stringify'd into the script — safe against XSS
  const html = `<!DOCTYPE html>
<html lang="${isRtl ? "ar" : "en"}" dir="${isRtl ? "rtl" : "ltr"}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>*{box-sizing:border-box;margin:0;padding:0}html,body{background:#F2EDEE;font-family:'Outfit',sans-serif}</style>
</head>
<body>
  <div id="paymob-elements" style="width:100%"></div>
  <script type="module">
    const cs  = ${JSON.stringify(cs)};
    const pk  = ${JSON.stringify(pk)};
    const bid = ${JSON.stringify(bid)};
    const origin = window.location.origin;

    if (!cs || !pk) {
      parent.postMessage({ type: "PIXEL_ERROR", msg: "missing params" }, "*");
    } else if (!window.__pixelStarted) {
      window.__pixelStarted = true;
      await import("https://cdn.jsdelivr.net/npm/paymob-pixel@latest/main.js").catch(() => {});
      const Pixel = window.Pixel;
      if (!Pixel) {
        parent.postMessage({ type: "PIXEL_ERROR", msg: "SDK not loaded" }, "*");
      } else {
        new Pixel({
          publicKey: pk,
          clientSecret: cs,
          paymentMethods: ["card", "apple-pay"],
          elementId: "paymob-elements",
          showSaveCard: false,
          forceSaveCard: false,
          customStyle: {
            Font_Family: "Outfit",
            Font_Size_Label: "13",
            Font_Size_Input_Fields: "15",
            Font_Size_Payment_Button: "15",
            Font_Weight_Label: 600,
            Font_Weight_Input_Fields: 400,
            Font_Weight_Payment_Button: 600,
            Color_Container: "#F2EDEE",
            Color_Input_Fields: "#FFFFFF",
            Color_Border_Input_Fields: "#DDD5D7",
            Color_Border_Payment_Button: "#5A0F1B",
            Radius_Border: "12",
            Color_Disabled: "#C9B8BB",
            Color_Error: "#CC1142",
            Color_Primary: "#5A0F1B",
            Text_Color_For_Label: "#0E0B0D",
            Text_Color_For_Payment_Button: "#F2EDEE",
            Text_Color_For_Input_Fields: "#0E0B0D",
            Color_For_Text_Placeholder: "#9B8A8D",
            Width_of_Container: "100%",
            Vertical_Padding: "20",
            Vertical_Spacing_between_components: "14",
            Container_Padding: "20",
          },
          afterPaymentComplete: () => {
            parent.postMessage({ type: "PAYMENT_SUCCESS", bookingId: bid }, origin);
          },
          onPaymentCancel: () => {
            parent.postMessage({ type: "PAYMENT_CANCEL" }, origin);
          },
        });

        new ResizeObserver(() => {
          parent.postMessage({ type: "RESIZE", height: document.body.scrollHeight }, origin);
        }).observe(document.body);
      }
    }
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Frame-Options": "SAMEORIGIN",
    },
  });
}
