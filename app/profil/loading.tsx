import { Container } from "@/components/layout/Container";
import { OutfitGridSkeleton } from "@/components/shared/OutfitGridSkeleton";

export default function ProfilLoading() {
  return (
    <main className="flex-1 pt-20 md:pt-24 pb-16" aria-busy="true">
      <Container>
        <div className="flex flex-col items-center text-center mt-8 mb-8">
          <div className="h-24 w-24 rounded-full bg-foreground-subtle/10 animate-pulse" />
          <div className="mt-4 h-8 w-48 bg-foreground-subtle/10 rounded animate-pulse" />
          <div className="mt-2 h-4 w-32 bg-foreground-subtle/5 rounded animate-pulse" />
        </div>
        <div className="flex justify-center gap-6 mb-8">
          <div className="h-12 w-20 bg-foreground-subtle/5 rounded animate-pulse" />
          <div className="h-12 w-20 bg-foreground-subtle/5 rounded animate-pulse" />
          <div className="h-12 w-20 bg-foreground-subtle/5 rounded animate-pulse" />
        </div>
        <OutfitGridSkeleton columns={3} count={6} />
      </Container>
    </main>
  );
}
