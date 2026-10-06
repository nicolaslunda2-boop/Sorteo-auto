import type { Metadata, Viewport } from "next";
import { Manrope, Playfair_Display } from "next/font/google";
import { CartProvider } from "@/components/CartProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { CartBar } from "@/components/CartBar";
import { SORTEO } from "@/lib/config";
import "./globals.css";

const serif = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${SORTEO.titulo} · ${SORTEO.auto}`,
  description: "Comprá tu cartón de bingo oficial y participá por un auto 0km, $1.000.000 y $2.000.000.",
};

export const viewport: Viewport = {
  themeColor: "#0a1430",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <CartProvider>
          <SiteHeader />
          <main>{children}</main>
          <CartBar />
        </CartProvider>
      </body>
    </html>
  );
}
