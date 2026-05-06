import type { Metadata, Viewport } from "next";
import { Inter, Anton } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
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
  metadataBase: new URL("https://moidello.com"),
  title: {
    default: "Moidello — Inspiration för varje outfit",
    template: "%s | Moidello",
  },
  description:
    "Upptäck, dela och inspireras av outfits. Tagga varje plagg och hitta var du kan köpa det.",
  applicationName: "Moidello",
  keywords: [
    "outfits",
    "mode",
    "stil",
    "inspiration",
    "shopping",
    "kläder",
    "fashion",
    "moidello",
  ],
  authors: [{ name: "Moidello" }],
  openGraph: {
    type: "website",
    locale: "sv_SE",
    url: "https://moidello.com",
    siteName: "Moidello",
    title: "Moidello — Inspiration för varje outfit",
    description:
      "Upptäck, dela och inspireras av outfits. Tagga varje plagg och hitta var du kan köpa det.",
    images: [
      {
        url: "/images/bg/positano.jpg",
        alt: "Moidello",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Moidello — Inspiration för varje outfit",
    description:
      "Upptäck, dela och inspireras av outfits. Tagga varje plagg och hitta var du kan köpa det.",
    images: ["/images/bg/positano.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
  appleWebApp: {
    capable: true,
    title: "Moidello",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
