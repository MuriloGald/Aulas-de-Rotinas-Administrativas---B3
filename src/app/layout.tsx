import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CBMSC — HUB DO INSTRUTOR",
    template: "%s | CBMSC B3",
  },
  description:
    "Hub profissional de instrução em Rotinas Administrativas B3. Corpo de Bombeiros Militar de Santa Catarina.",
  keywords: [
    "bombeiros",
    "cbmsc",
    "rotinas administrativas",
    "B3",
    "instrução",
    "santa catarina",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${geistMono.variable} dark`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh flex flex-col antialiased">{children}</body>
    </html>
  );
}
