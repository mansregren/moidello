import type { Metadata, Viewport } from "next";
import { Inter, Anton } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GenderProvider } from "@/lib/gender-context";
import { ToastProvider } from "@/lib/toast-context";
import { AuthProvider, type AuthProfile } from "@/lib/auth-context";
import { ViewerEngagementProvider } from "@/lib/viewer-engagement-context";
import { AppShell } from "@/components/layout/AppShell";
import { ImpersonationBanner } from "@/components/admin/ImpersonationBanner";
import { CookieBanner } from "@/components/layout/CookieBanner";
import { JsonLd } from "@/components/seo/JsonLd";
import { pickBg } from "@/lib/session-background";
import { getViewerGender } from "@/lib/gender-server";
import { damVisible } from "@/lib/flags";
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
    default: "Moidello",
    template: "%s | Moidello",
  },
  description:
    "Discover, share and get inspired by outfits. Tag every piece and find where to buy it.",
  applicationName: "Moidello",
  keywords: [
    "outfits",
    "fashion",
    "style",
    "inspiration",
    "shopping",
    "clothing",
    "outfit ideas",
    "moidello",
  ],
  authors: [{ name: "Moidello" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://moidello.com",
    siteName: "Moidello",
    title: "Moidello",
    description:
      "Discover, share and get inspired by outfits. Tag every piece and find where to buy it.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Moidello",
    description:
      "Discover, share and get inspired by outfits. Tag every piece and find where to buy it.",
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
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

export const viewport: Viewport = {
  themeColor: "#F7F6F3",
  colorScheme: "light",
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
      .select("username, display_name, avatar_url, is_admin")
      .eq("id", user.id)
      .maybeSingle();
    if (profileRow) {
      initialProfile = {
        username: profileRow.username as string,
        displayName: (profileRow.display_name as string | null) ?? null,
        avatarUrl: (profileRow.avatar_url as string | null) ?? null,
        isAdmin: !!(profileRow.is_admin as boolean | null),
      };
    }
  }

  const footerBg = await pickBg("footer");
  const isAdmin = !!initialProfile?.isAdmin;
  const initialGender = await getViewerGender(isAdmin);
  const genderLockedToHerr = !damVisible(isAdmin);

  return (
    <html
      lang="en"
      className={`${inter.variable} ${anton.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {/* Site-wide structured data: Organization + WebSite (with sitelinks
            search box). Page-level JSON-LD goes inside the route components. */}
        <JsonLd data={siteJsonLd()} />
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <ImpersonationBanner />
        <AuthProvider initialUser={user} initialProfile={initialProfile}>
          <ToastProvider>
            <GenderProvider
              initial={initialGender}
              lockedToHerr={genderLockedToHerr}
            >
              <ViewerEngagementProvider>
                <AppShell footerBg={footerBg}>{children}</AppShell>
              </ViewerEngagementProvider>
            </GenderProvider>
          </ToastProvider>
        </AuthProvider>
        <CookieBanner />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
