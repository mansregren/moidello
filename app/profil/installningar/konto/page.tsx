import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";
import { createClient } from "@/lib/supabase/server";
import { AccountSettingsClient } from "./AccountSettingsClient";

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/profil/installningar/konto");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="flex-1 pt-20 md:pt-24 pb-16">
        <Container className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.3em] text-foreground-subtle mb-4">
            Inställningar / Konto
          </p>
          <h1 className="font-heading text-4xl md:text-6xl uppercase tracking-tight leading-none">
            Konto & sekretess
          </h1>
          <p className="mt-6 text-foreground-muted">
            Hantera din data. Du kan när som helst exportera allt vi har om
            dig eller radera ditt konto permanent.
          </p>

          <AccountSettingsClient
            username={profile?.username ?? user.email ?? "ditt-konto"}
          />
        </Container>
      </main>
    </>
  );
}
