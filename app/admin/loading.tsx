import { Container } from "@/components/layout/Container";

export default function AdminLoading() {
  return (
    <main className="flex-1 pt-20 md:pt-24 pb-16" aria-busy="true">
      <Container className="max-w-6xl">
        <div className="flex gap-1 mb-10 border-b border-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-10 w-24 bg-foreground-subtle/5 rounded-t animate-pulse"
            />
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-xl bg-foreground-subtle/5 animate-pulse"
            />
          ))}
        </div>
      </Container>
    </main>
  );
}
