import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";

export default function KontaktPage() {
  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="flex-1">
        <Container className="py-20 md:py-32 max-w-3xl">
          <p className="text-xs uppercase tracking-[0.3em] text-foreground-subtle mb-4">
            Kontakt
          </p>
          <h1 className="font-heading text-5xl md:text-7xl uppercase tracking-tight leading-none">
            Hör av dig
          </h1>
          <p className="mt-8 text-lg text-foreground-muted leading-relaxed max-w-2xl">
            Frågor, samarbete eller feedback — vi läser allt. Skriv till oss
            direkt så återkommer vi inom två arbetsdagar.
          </p>

          <div className="mt-14 grid gap-10 md:grid-cols-2">
            <div className="border-t border-border pt-8">
              <p className="text-xs uppercase tracking-[0.2em] text-foreground-subtle mb-3">
                Generellt
              </p>
              <a
                href="mailto:hello@moidello.com"
                className="font-heading text-2xl md:text-3xl uppercase tracking-tight text-foreground border-b border-foreground/30 hover:border-foreground transition-colors"
              >
                hello@moidello.com
              </a>
              <p className="mt-4 text-sm text-foreground-muted">
                Allmänna frågor, support, feedback.
              </p>
            </div>

            <div className="border-t border-border pt-8">
              <p className="text-xs uppercase tracking-[0.2em] text-foreground-subtle mb-3">
                Brands & samarbete
              </p>
              <a
                href="mailto:hello@moidello.com?subject=Brand%20samarbete"
                className="font-heading text-2xl md:text-3xl uppercase tracking-tight text-foreground border-b border-foreground/30 hover:border-foreground transition-colors"
              >
                hello@moidello.com
              </a>
              <p className="mt-4 text-sm text-foreground-muted">
                Varumärken som vill claima sin sida eller samarbeta.
              </p>
            </div>
          </div>

          <div className="mt-20 pt-10 border-t border-border">
            <p className="text-xs text-foreground-subtle">
              Made in Stockholm
            </p>
          </div>
        </Container>
      </main>
    </>
  );
}
