import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";
import { createClient } from "@/lib/supabase/server";
import { ImportProductsClient } from "./ImportProductsClient";

export const metadata = { title: "Importera produkter" };
export const dynamic = "force-dynamic";

export default async function BrandImportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/brand-dashboard/import");

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type, brand_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.account_type !== "brand" || !profile.brand_name) {
    redirect("/brand-dashboard");
  }

  const { count } = await supabase
    .from("brand_products")
    .select("id", { count: "exact", head: true })
    .eq("brand_profile_id", user.id);

  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="flex-1 pt-20 md:pt-24 pb-16">
        <Container className="max-w-3xl">
          <Link
            href="/brand-dashboard"
            className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-white mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Tillbaka till dashboard
          </Link>

          <p className="text-xs uppercase tracking-[0.3em] text-foreground-subtle mb-4">
            Bulk-import
          </p>
          <h1 className="font-heading text-4xl md:text-6xl uppercase tracking-tight leading-none">
            Importera produktkatalog
          </h1>
          <p className="mt-6 text-foreground-muted">
            Ladda upp eller klistra in en CSV-fil med dina plagg. Du har just
            nu {count ?? 0} produkter i din katalog.
          </p>

          <section className="mt-10 rounded-2xl border border-border bg-background-secondary p-6 md:p-8">
            <h2 className="font-heading text-xl uppercase tracking-tight text-white mb-3">
              CSV-format
            </h2>
            <p className="text-sm text-foreground-muted mb-4">
              Första raden måste innehålla kolumnnamnen nedan. Endast{" "}
              <code className="text-white">name</code> krävs — resten är
              valfria. Värden med komma måste omslutas med citationstecken.
            </p>
            <pre className="text-xs text-foreground-muted bg-background-tertiary rounded-xl p-4 overflow-x-auto">
              {`name,description,price,currency,buy_url,image_url
Venice Cardigan,Stickad i merinoull,1295,SEK,https://example.com/venice,https://example.com/img.jpg
Riviera Trouser,,1495,SEK,https://example.com/riviera,
"Capri Top, satin",,795,SEK,https://example.com/capri,`}
            </pre>
            <p className="mt-4 text-xs text-foreground-subtle">
              Max 500 rader per import. Pris i decimalform (kommatecken
              accepteras). URL:er måste börja med http:// eller https://.
            </p>
          </section>

          <ImportProductsClient />
        </Container>
      </main>
    </>
  );
}
