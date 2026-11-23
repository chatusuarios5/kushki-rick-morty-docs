import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Luckiest_Guy } from "next/font/google";

import { Navbar } from "@/components/Navbar";

// @ts-ignore: Next.js provides CSS side-effect import typings through next-env.d.ts.
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });
const luckiest = Luckiest_Guy({ subsets: ["latin"], weight: "400", variable: "--font-luckiest", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "Rick and Morty Docs",
    template: "%s - Rick and Morty Docs",
  },
  description:
    "Documentación interactiva del endpoint GET /character/{id} de la API de Rick and Morty: referencia, consola para probarlo y resúmenes con IA.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${jetbrains.variable} ${luckiest.variable}`}>
      <body>
        <Navbar />
        <main className="container">{children}</main>
        <footer className="site-footer">
          <div className="container">
            <span>Proyecto académico · Documentación de API</span>
            <span>
              Datos de{" "}
              <a href="https://rickandmortyapi.com/documentation" target="_blank" rel="noreferrer">
                The Rick and Morty API
              </a>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
