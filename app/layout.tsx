import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import ClientShell from "@/app/_components/ClientShell";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "WellnessHub — Book Wellness Services",
  description: "Book beauty and wellness services — salons, spas, fitness centers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-light text-dark pb-[68px] md:pb-0">
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
