import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Logga in",
  description: "Logga in på ditt Moidello-konto.",
  alternates: { canonical: "/login" },
  robots: { index: false, follow: true },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
