import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";
import { createClient } from "@/lib/supabase/server";
import { outfitPathFromParts } from "@/lib/outfit-url";
import { EditOwnOutfit, type OwnOutfitForm } from "./EditOwnOutfit";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Redigera inlägg",
  robots: { index: false, follow: false },
};

export default async function EditOwnOutfitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: outfit } = await supabase
    .from("outfits")
    .select(
      "id, slug, user_id, title, description, category, image_url, is_published, profiles:user_id(username)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!outfit) notFound();

  if ((outfit.user_id as string) !== user.id) {
    // Owner gate is also enforced on the server action; this just keeps the
    // UI honest for someone who guessed the URL.
    redirect("/profil");
  }

  const username =
    (outfit.profiles as unknown as { username: string } | null)?.username ?? "";

  const publicUrl =
    outfit.slug && username
      ? outfitPathFromParts(username, outfit.slug as string, outfit.id as string)
      : `/outfit/${outfit.id}`;

  const form: OwnOutfitForm = {
    id: outfit.id as string,
    title: outfit.title as string,
    description: (outfit.description as string | null) ?? "",
    category: (outfit.category as string | null) ?? "",
    imageUrl: outfit.image_url as string,
    isPublished: !!outfit.is_published,
    publicUrl,
  };

  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="flex-1 pt-20 md:pt-24 pb-16">
        <Container className="max-w-3xl">
          <Link
            href="/profil"
            className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Tillbaka till profilen
          </Link>

          <div className="mb-6 flex items-center justify-between gap-3">
            <h1 className="font-heading text-3xl md:text-4xl uppercase tracking-tight text-foreground">
              Redigera inlägg
            </h1>
            <Link
              href={publicUrl}
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs text-foreground-muted hover:text-foreground"
            >
              Publik vy
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          <EditOwnOutfit form={form} />
        </Container>
      </main>
    </>
  );
}
