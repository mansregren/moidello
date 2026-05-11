import { redirect } from "next/navigation";
import Link from "next/link";
import { isCurrentUserAdmin } from "@/lib/admin";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";

export const metadata = {
  title: "Admin · Moidello",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ok = await isCurrentUserAdmin();
  if (!ok) redirect("/");

  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="flex-1 pt-20 md:pt-24 pb-16">
        <Container className="max-w-6xl">
          <nav className="flex flex-wrap gap-1 mb-10 border-b border-border">
            <AdminTab href="/admin" label="Översikt" />
            <AdminTab href="/admin/anvandare" label="Användare" />
            <AdminTab href="/admin/anmalningar" label="Anmälningar" />
          </nav>
          {children}
        </Container>
      </main>
    </>
  );
}

function AdminTab({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="px-4 py-3 text-sm font-medium text-foreground-muted hover:text-white border-b-2 border-transparent hover:border-white/30 -mb-px transition-colors"
    >
      {label}
    </Link>
  );
}
