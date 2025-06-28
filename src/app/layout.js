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
  icons: {
    icon: "/cpu.png",
    shortcut: "/cpu.png",
    apple: "/cpu.png",
  },
  openGraph: {
    title: "Simulador de Cache Z70",
    description:
      "Simulador de memória cache para a arquitetura hipotética Z70 - TDE 2",
    url: "https://simulador-cache-z70.vercel.app",
    siteName: "Simulador Cache Z70",
    images: [
      {
        url: "/cpu.png",
        width: 512,
        height: 512,
        alt: "Logo do Simulador Cache Z70",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
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
