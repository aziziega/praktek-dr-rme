import type { Metadata } from "next";
import { Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ClientProviders } from "@/components/providers/ClientProviders";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  weight: ["400", "500", "600"],
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
      className={`${inter.variable} ${spaceGrotesk.variable} ${ibmPlexMono.variable} h-full overflow-hidden antialiased`}
      suppressHydrationWarning
    >
      <body className="h-full overflow-hidden flex flex-col font-sans">
        <ClientProviders>
          {children}
        </ClientProviders>
        <Toaster position="top-right" closeButton richColors />
      </body>
    </html>
  );
}
