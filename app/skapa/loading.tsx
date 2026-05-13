import { Container } from "@/components/layout/Container";

export default function SkapaLoading() {
  return (
    <main className="flex-1 pt-20 md:pt-24 pb-16" aria-busy="true">
      <Container className="max-w-3xl">
        <div className="h-10 w-48 bg-foreground-subtle/10 rounded animate-pulse mb-8" />
        <div className="rounded-2xl border border-border bg-background-secondary p-6 space-y-4">
          <div className="aspect-[3/4] rounded-xl bg-foreground-subtle/5 animate-pulse" />
          <div className="h-10 bg-foreground-subtle/10 rounded animate-pulse" />
          <div className="h-24 bg-foreground-subtle/5 rounded animate-pulse" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-10 bg-foreground-subtle/5 rounded animate-pulse" />
            <div className="h-10 bg-foreground-subtle/5 rounded animate-pulse" />
          </div>
        </div>
      </Container>
    </main>
  );
}
