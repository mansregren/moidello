import { Container } from "@/components/layout/Container";

export default function BrandsLoading() {
  return (
    <main className="flex-1 pt-20 md:pt-24 pb-16" aria-busy="true">
      <Container>
        <div className="h-12 w-64 bg-foreground-subtle/10 rounded animate-pulse mb-10" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-foreground-subtle/5 h-28 animate-pulse"
            />
          ))}
        </div>
      </Container>
    </main>
  );
}
