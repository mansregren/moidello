import { Container } from "@/components/layout/Container";
import { OutfitGridSkeleton } from "@/components/shared/OutfitGridSkeleton";

export default function SokLoading() {
  return (
    <main className="flex-1 pt-20 md:pt-24 pb-16" aria-busy="true">
      <Container>
        <div className="h-4 w-24 bg-foreground-subtle/5 rounded animate-pulse mb-3" />
        <div className="h-14 w-80 bg-foreground-subtle/10 rounded animate-pulse mb-8" />
        <div className="h-6 w-32 bg-foreground-subtle/10 rounded animate-pulse mb-4" />
        <OutfitGridSkeleton columns={4} count={8} />
      </Container>
    </main>
  );
}
