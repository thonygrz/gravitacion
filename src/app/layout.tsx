import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

// latin-ext covers the names of the authors cited in the gallery (Šuvakov, Dmitrašinović).
const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin", "latin-ext"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: { default: "Gravitación", template: "%s | Gravitación" },
  description:
    "La ley de gravitación universal de Newton explicada paso a paso y una galería de órbitas periódicas del problema de los tres cuerpos.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-dvh font-sans text-ink antialiased">
        <a
          href="#contenido"
          className="sr-only rounded-md bg-accent px-4 py-2 font-medium text-night focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
        >
          Saltar al contenido
        </a>
        <SiteHeader />
        <main id="contenido" tabIndex={-1} className="outline-none">
          {children}
        </main>
      </body>
    </html>
  );
}
