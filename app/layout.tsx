import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
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

// Applies the saved/system theme before paint to avoid a flash of the wrong mode.
// Themes: 'light' | 'dark' | 'neon'. 'neon' applies both classes (dark + neon).
const themeScript = `(function(){try{var t=localStorage.getItem('theme');var c=document.documentElement.classList;if(t==='neon'){c.add('dark','neon');}else if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){c.add('dark');}}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={montserrat.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <PostHogInit />
        <MetaPixel />
        {children}
      </body>
    </html>
  );
}
