"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";

export default function MeddelandenError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface in Vercel function logs without exposing details to the user
    console.error("[meddelanden] route error:", error);
  }, [error]);

  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="flex-1 pt-10">
        <Container className="max-w-xl text-center py-20">
          <MessageCircle className="mx-auto h-10 w-10 text-foreground-subtle mb-5" />
          <h1 className="font-heading text-3xl md:text-4xl uppercase tracking-tight text-white">
            Det blev fel
          </h1>
          <p className="mt-4 text-foreground-muted">
            Vi kunde inte ladda meddelanden just nu. Försök igen om en stund.
          </p>
          {error.digest && (
            <p className="mt-3 text-xs text-foreground-subtle font-mono">
              Felkod: {error.digest}
            </p>
          )}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium hover:bg-white/90 transition-colors"
            >
              Försök igen
            </button>
            <Link
              href="/profil"
              className="inline-flex items-center gap-2 rounded-full border border-border text-white px-5 py-2.5 text-sm font-medium hover:border-white/30 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Tillbaka till profilen
            </Link>
          </div>
        </Container>
      </main>
    </>
  );
}
