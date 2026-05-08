import type { Metadata, Viewport } from "next";
import { Inter, Anton } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GenderProvider } from "@/lib/gender-context";
import { ToastProvider } from "@/lib/toast-context";
import { AuthProvider, type AuthProfile } from "@/lib/auth-context";
import { AppShell } from "@/components/layout/AppShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { siteJsonLd } from "@/lib/json-ld";
import { createClient } from "@/lib/supabase/server";
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
  },
  twitter: {
    card: "summary_large_image",
    title: "Moidello — Inspiration för varje outfit",
    description:
      "Upptäck, dela och inspireras av outfits. Tagga varje plagg och hitta var du kan köpa det.",
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Resolve auth + profile server-side so the header renders with the
  // logged-in state on first paint (no flash of "Logga in").
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialProfile: AuthProfile | null = null;
  if (user) {
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("username, display_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();
    if (profileRow) {
      initialProfile = {
        username: profileRow.username as string,
        displayName: (profileRow.display_name as string | null) ?? null,
        avatarUrl: (profileRow.avatar_url as string | null) ?? null,
      };
    }
  }

  return (
    <html
      lang="sv"
      className={`${inter.variable} ${anton.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {/* Site-wide structured data: Organization + WebSite (with sitelinks
            search box). Page-level JSON-LD goes inside the route components. */}
        <JsonLd data={siteJsonLd()} />
        <a href="#main" className="skip-link">
          Hoppa till innehåll
        </a>
        <AuthProvider initialUser={user} initialProfile={initialProfile}>
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
