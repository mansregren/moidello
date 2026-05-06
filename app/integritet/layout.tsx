import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Integritetspolicy",
  description:
    "Hur Moidello samlar in, använder och skyddar personuppgifter i enlighet med GDPR.",
  alternates: { canonical: "/integritet" },
};

export default function IntegritetLayout({ children }: { children: React.ReactNode }) {
  return children;
}
