import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Moidello collects, uses and protects personal data in accordance with the GDPR.",
  alternates: { canonical: "/integritet" },
};

export default function IntegritetLayout({ children }: { children: React.ReactNode }) {
  return children;
}
