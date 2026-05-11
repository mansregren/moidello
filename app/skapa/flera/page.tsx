import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";
import { BulkUploadClient } from "./BulkUploadClient";

export const metadata = {
  title: "Ladda upp flera outfits",
  description: "Ladda upp flera outfit-bilder på en gång.",
  alternates: { canonical: "/skapa/flera" },
};

export const dynamic = "force-dynamic";

export default async function SkapaFleraPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/skapa/flera");

  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="flex-1 pt-20 md:pt-24 pb-16">
        <Container className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.3em] text-foreground-subtle mb-4">
            Bulk-uppladdning
          </p>
          <h1 className="font-heading text-4xl md:text-6xl uppercase tracking-tight leading-none">
            Flera outfits på en gång
          </h1>
          <p className="mt-6 text-foreground-muted">
            Ladda upp upp till 10 bilder. Skriv titel och välj kategori för
            var och en. Du kan tagga plaggen senare via varje outfit-sida.
          </p>

          <BulkUploadClient />
        </Container>
      </main>
    </>
  );
}
