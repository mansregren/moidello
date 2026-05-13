import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Skapa outfit",
  description: "Bygg och dela din egen outfit. Tagga plagg och länka var de finns att köpa.",
  alternates: { canonical: "/skapa" },
  robots: { index: false, follow: true },
};

export default function SkapaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
