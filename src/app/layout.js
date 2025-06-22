// src/app/layout.jsx
import "./globals.css";
import { Inter } from "next/font/google";
import { Header } from "../components/layout/Header";
import { Toaster } from "../components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Simulador de Cache Z70",
  description:
    "Simulador de memória cache para a arquitetura hipotética Z70 - TDE 2",
  keywords: ["cache", "simulador", "arquitetura", "Z70", "TDE"],
  authors: [{ name: "Estudante UCS" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          <Header />
          <main>{children}</main>
          <Toaster />
        </div>
      </body>
    </html>
  );
}
