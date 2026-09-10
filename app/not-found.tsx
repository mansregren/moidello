import Link from "next/link";
import { Container } from "@/components/layout/Container";

export const metadata = {
  title: "404 — Page not found | Moidello",
  description: "The page you're looking for no longer exists or has moved.",
};

export default function NotFound() {
  return (
    <main id="main" tabIndex={-1} className="flex-1 flex items-center justify-center py-24">
      <Container className="text-center max-w-xl">
        <p className="font-heading text-foreground-subtle text-sm tracking-[0.3em] uppercase mb-6">
          Error 404
        </p>
        <h1 className="font-heading text-6xl md:text-8xl leading-none mb-6">
          Lost
        </h1>
        <p className="text-foreground-muted text-base md:text-lg mb-10 max-w-md mx-auto">
          The page you're looking for no longer exists — or it has moved.
          No garments lost in the process.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-medium hover:opacity-90 transition"
          >
            Back to home
          </Link>
          <Link
            href="/upptack"
            className="inline-flex items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-medium hover:bg-secondary transition"
          >
            Discover outfits
          </Link>
        </div>
      </Container>
    </main>
  );
}
