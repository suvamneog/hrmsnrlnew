import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Noto_Sans_Bengali, Noto_Sans_Devanagari, Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

// Hindi and Assamese scripts, used only where Latin glyphs are missing.
const devanagari = Noto_Sans_Devanagari({ variable: "--font-deva", subsets: ["devanagari"], weight: ["400", "500", "600", "700"] });
const bengali = Noto_Sans_Bengali({ variable: "--font-beng", subsets: ["bengali"], weight: ["400", "500", "600", "700"] });

const plex = IBM_Plex_Mono({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "NRL People",
  description: "HRMS for Numaligarh Refinery Limited",
  appleWebApp: { capable: true, title: "NRL People", statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#3d5afe" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${plex.variable} ${devanagari.variable} ${bengali.variable} h-full antialiased`}>
      <body className="min-h-full bg-bg font-sans text-ink">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
