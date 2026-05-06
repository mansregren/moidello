import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Skapa konto",
  description: "Skapa ett gratis Moidello-konto och börja dela dina outfits.",
  alternates: { canonical: "/signup" },
  robots: { index: false, follow: true },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
