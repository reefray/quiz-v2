import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import PostHogInit from "@/components/PostHogInit";
import MetaPixel from "@/components/MetaPixel";

// RN brand font. Weights map to Montserrat-{Regular,Medium,SemiBold,Bold,ExtraBold,Black}.
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Barbr",
  description: "Get your booking page in under 5 minutes.",
};

// Fixed theme, set via env (no in-app toggle). NEXT_PUBLIC_THEME: 'light' | 'dark'
// | 'neon' (default 'neon' — the near-black variant). 'neon' applies both classes.
const THEME = process.env.NEXT_PUBLIC_THEME || "neon";
const themeClass = THEME === "neon" ? "dark neon" : THEME === "dark" ? "dark" : "";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${montserrat.variable} ${themeClass}`}>
      <body>
        <PostHogInit />
        <MetaPixel />
        {children}
        <Script
          src="https://onelinksmartscript.appsflyersdk.com/onelink-smart-script-latest.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
