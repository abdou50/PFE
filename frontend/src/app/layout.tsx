import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { RouteProtection } from "@/components/route-protection";
import { ThemeProvider } from "@/components/providers/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Centre de Service Intégré",
  description: "Application de gestion des réclamations du Centre de Service Intégré",
  icons: {
    icon: "/csi.png",
    shortcut: "/csi.png",
    apple: "/csi.png",
    other: {
      rel: "apple-touch-icon-precomposed",
      url: "/csi.png"
    }
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <meta
          name="format-detection"
          content="telephone=no, date=no, email=no, address=no"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
        <ThemeProvider>
          <RouteProtection>
            {children}
          </RouteProtection>
        </ThemeProvider>
      </body>
    </html>
  );
}
