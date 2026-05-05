import type { Metadata } from "next";
import { Inter, Anton } from "next/font/google";
import { GenderProvider } from "@/lib/gender-context";
import { ToastProvider } from "@/lib/toast-context";
import { AuthProvider } from "@/lib/auth-context";
import { AppShell } from "@/components/layout/AppShell";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: "Moidello — Inspiration for Every Outfit",
  description:
    "Discover, share, and shop outfits. Tag every piece, link where to buy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="sv"
      className={`${inter.variable} ${anton.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AuthProvider>
          <ToastProvider>
            <GenderProvider>
              <AppShell>{children}</AppShell>
            </GenderProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
