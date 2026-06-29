import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ClientProviders } from "@/components/providers/ClientProviders";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RME — Praktek Dr. Umum Sudiman",
  description:
    "Sistem Rekam Medis Elektronik untuk Praktek Dr. Umum Sudiman, Gupolo, Prambanan, Klaten",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full overflow-hidden antialiased`}
    >
      <body className="h-full overflow-hidden flex flex-col">
        <ClientProviders>
          {children}
        </ClientProviders>
        <Toaster position="top-right" closeButton richColors />
      </body>
    </html>
  );
}

