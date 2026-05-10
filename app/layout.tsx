import type { Metadata } from "next";
import { Outfit, Cairo } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import ClientShell from "@/app/_components/ClientShell";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "WellnessHub — Book Wellness Services",
  description: "Book beauty and wellness services — salons, spas, fitness centers",
  appleWebApp: {
    title: "WellnessHub",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const host = headersList.get("host") ?? "";
  const isPos = host.startsWith("pos.");

  return (
    <html
      lang="en"
      dir="ltr"
      className={`${outfit.variable} ${cairo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-light text-dark pb-[68px] md:pb-0">
        <ClientShell isPos={isPos}>{children}</ClientShell>
      </body>
    </html>
  );
}
