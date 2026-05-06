import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kontakt",
  description:
    "Kontakta Moidello — frågor, samarbete och feedback. Vi återkommer inom två arbetsdagar.",
  alternates: { canonical: "/kontakt" },
};

export default function KontaktLayout({ children }: { children: React.ReactNode }) {
  return children;
}
