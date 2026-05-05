"use client";

import { useRef, useState, TouchEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";
import { OutfitGrid } from "@/components/outfit/OutfitGrid";
import { outfits, users } from "@/lib/data";
import { useGender, matchesGenderFilter } from "@/lib/gender-context";
import { cn } from "@/lib/utils";

type FeedTab = "for-you" | "following";

const PULL_THRESHOLD = 80;
const PULL_MAX = 120;

export default function HomePage() {
  const { gender } = useGender();
  const [tab, setTab] = useState<FeedTab>("for-you");
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Pull-to-refresh state (mobile only)
  const [pullDistance, setPullDistance] = useState(0);
  const startYRef = useRef<number | null>(null);
  const pullingRef = useRef(false);

  const followedIds = new Set(users.slice(0, 3).map((u) => u.id));

  const filtered = outfits.filter((o) => matchesGenderFilter(o.gender, gender));
  const visible =
    tab === "following"
      ? filtered.filter((o) => followedIds.has(o.creator.id))
      : filtered;

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (window.scrollY > 0) return;
    startYRef.current = e.touches[0].clientY;
    pullingRef.current = true;
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!pullingRef.current || startYRef.current === null) return;
    if (window.scrollY > 0) {
      pullingRef.current = false;
      setPullDistance(0);
      return;
    }
    const delta = e.touches[0].clientY - startYRef.current;
    if (delta <= 0) {
      setPullDistance(0);
      return;
    }
    setPullDistance(Math.min(delta * 0.5, PULL_MAX));
  };

  const handleTouchEnd = () => {
    if (!pullingRef.current) return;
    pullingRef.current = false;
    const triggered = pullDistance >= PULL_THRESHOLD;
    setPullDistance(0);
    startYRef.current = null;
    if (triggered) refresh();
  };

  const refresh = () => {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
    window.setTimeout(() => setRefreshing(false), 700);
  };

  return (
    <>
      <Header />
      <main
        className="flex-1"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {/* Tabs */}
        <div className="sticky top-16 md:top-20 z-30 bg-background/80 backdrop-blur-md border-b border-white/5">
          <Container>
            <div className="flex items-center gap-1 h-12">
              <FeedTabButton
                active={tab === "for-you"}
                onClick={() => setTab("for-you")}
              >
                För dig
              </FeedTabButton>
              <FeedTabButton
                active={tab === "following"}
                onClick={() => setTab("following")}
              >
                Följer
              </FeedTabButton>
            </div>
          </Container>
        </div>

        {/* Pull-to-refresh indicator */}
        <div
          className="md:hidden flex items-center justify-center overflow-hidden transition-[height] duration-200"
          style={{
            height: refreshing ? 56 : pullDistance,
          }}
        >
          <Loader2
            className={cn(
              "h-5 w-5 text-white/70",
              refreshing ? "animate-spin" : ""
            )}
            style={{
              transform: refreshing
                ? undefined
                : `rotate(${(pullDistance / PULL_THRESHOLD) * 270}deg)`,
              opacity: Math.min(pullDistance / PULL_THRESHOLD, 1) || (refreshing ? 1 : 0),
            }}
          />
        </div>

        <Container className="pt-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${tab}-${gender}-${refreshKey}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {visible.length > 0 ? (
                <OutfitGrid outfits={visible} columns={3} />
              ) : (
                <div className="py-24 text-center">
                  <p className="text-foreground-muted text-lg">
                    {tab === "following"
                      ? "Du följer inga kreatörer än"
                      : "Inga outfits hittades"}
                  </p>
                  {tab === "following" && (
                    <button
                      onClick={() => setTab("for-you")}
                      className="mt-4 text-sm text-white underline"
                    >
                      Bläddra &quot;För dig&quot;
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="py-16" />
        </Container>
      </main>
    </>
  );
}

function FeedTabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative px-4 py-2 text-sm font-medium transition-colors",
        active ? "text-white" : "text-foreground-subtle hover:text-foreground-muted"
      )}
    >
      {children}
      {active && (
        <motion.span
          layoutId="feed-tab-indicator"
          className="absolute inset-x-3 -bottom-px h-0.5 bg-white rounded-full"
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      )}
    </button>
  );
}
