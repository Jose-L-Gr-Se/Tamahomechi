import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { QueryProvider } from "@/providers/query-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { HouseholdProvider } from "@/providers/household-provider";
import "./globals.css";

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tamahomechi",
  description: "El Tamagotchi de tu hogar",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Tamahomechi",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#f7f3ef",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${sans.variable} ${display.variable}`}>
      <head />
      {/* Next.js auto-emits <link rel="icon"> from app/icon.tsx and
          <link rel="apple-touch-icon"> from app/apple-icon.tsx. */}
      <body className="min-h-dvh overscroll-none">
        <QueryProvider>
          <AuthProvider>
            <HouseholdProvider>
              {children}
            </HouseholdProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
