"use client";

import { ReactNode } from "react";
import { Home, Search, Plus, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Hem", icon: Home },
  { label: "Upptäck", icon: Search },
  { label: "Skapa", icon: Plus, primary: true },
  { label: "Trendigt", icon: Sparkles },
  { label: "Profil", icon: User },
];

export default function NavLabPage() {
  return (
    <main className="min-h-screen bg-background py-10">
      <div className="max-w-6xl mx-auto px-6">
        <h1 className="font-heading text-4xl md:text-5xl uppercase tracking-tight text-white mb-2">
          Nav-lab
        </h1>
        <p className="text-foreground-muted mb-10">
          Jämför varianter av navigationen. Säg vilken du vill rulla ut.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Variant name="A. Top inline (nuvarande)" subtitle="2 rader, sticky">
            <TopInline />
          </Variant>

          <Variant name="B. Floating pill bottom" subtitle="Liten flytande, mx-4 mb-4">
            <FloatingBottom />
          </Variant>

          <Variant name="C. Side pill — höger" subtitle="Vertikal flytande på högerkanten">
            <SidePill align="right" />
          </Variant>

          <Variant name="D. Side pill — vänster" subtitle="Vertikal flytande på vänsterkanten">
            <SidePill align="left" />
          </Variant>

          <Variant name="E. Bottom solid" subtitle="Full-width, klassisk app-stil">
            <BottomSolid />
          </Variant>

          <Variant name="F. Top nav-only" subtitle="Bara nav i headern, logo i botten">
            <TopNavOnly />
          </Variant>
        </div>

        <div className="mt-12 rounded-2xl border border-border bg-background-secondary p-6">
          <p className="text-sm text-foreground-muted">
            <span className="text-white font-medium">Tips:</span> klicka i mockuparna funkar inte —
            de är visuella förhandsvisningar. Säg t.ex. &quot;kör B&quot; så byter
            jag headern/AppShell till den varianten.
          </p>
        </div>
      </div>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Phone frame
// ─────────────────────────────────────────────────────────────────────

function Variant({
  name,
  subtitle,
  children,
}: {
  name: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-foreground-subtle mb-1">
        {subtitle}
      </p>
      <h2 className="text-base font-semibold text-white mb-3">{name}</h2>
      <PhoneFrame>{children}</PhoneFrame>
    </div>
  );
}

function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative w-full aspect-[9/16] max-w-[280px] mx-auto rounded-[2.5rem] border-[6px] border-zinc-800 bg-background-tertiary overflow-hidden shadow-2xl shadow-black/50">
      {children}
    </div>
  );
}

function MockContent({ paddingTop = 0, paddingBottom = 0, paddingX = 0 }: {
  paddingTop?: number;
  paddingBottom?: number;
  paddingX?: number;
}) {
  // Simulate scroll-y feed area
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        paddingTop,
        paddingBottom,
        paddingLeft: paddingX,
        paddingRight: paddingX,
      }}
    >
      <div className="h-full grid grid-cols-2 gap-1.5 p-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-md bg-gradient-to-br from-zinc-700/50 to-zinc-800/50"
            style={{ aspectRatio: i % 3 === 0 ? "3/4.5" : "3/4" }}
          />
        ))}
      </div>
    </div>
  );
}

function MockTopBar() {
  return (
    <div className="flex items-center justify-between px-3 py-2 bg-black/80 backdrop-blur-md border-b border-white/5">
      <div className="flex items-center rounded-full border border-white/10 bg-white/5 p-0.5 text-[7px] uppercase tracking-wider">
        <span className="px-1.5 py-0.5 rounded-full bg-white text-black font-bold">D</span>
        <span className="px-1.5 py-0.5 text-white/60 font-bold">H</span>
      </div>
      <span className="font-heading text-sm uppercase tracking-tight text-white">
        Moidello
      </span>
      <div className="flex items-center gap-1">
        <Search className="h-3 w-3 text-white" />
        <span className="rounded-full bg-white text-black px-1.5 py-0.5 text-[7px] font-bold uppercase">
          Logga in
        </span>
      </div>
    </div>
  );
}

// Tab styles
function HorizontalTabs({ size = "md" }: { size?: "sm" | "md" }) {
  const itemSize = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";
  const primarySize = size === "sm" ? "h-6 w-6" : "h-7 w-7";

  return (
    <ul className="flex items-center justify-around w-full">
      {NAV.map((item, i) => {
        const active = i === 0;
        const Icon = item.icon;
        if (item.primary) {
          return (
            <li key={item.label} className="flex-1 flex justify-center">
              <span
                className={cn(
                  "flex items-center justify-center rounded-full bg-white text-black",
                  primarySize
                )}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
              </span>
            </li>
          );
        }
        return (
          <li key={item.label} className="flex-1">
            <div
              className={cn(
                "flex flex-col items-center gap-0.5 py-1",
                active ? "text-white" : "text-white/40"
              )}
            >
              <Icon className={itemSize} strokeWidth={active ? 2.4 : 1.8} />
              <span className="text-[6px] font-medium tracking-wide">
                {item.label}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function VerticalTabs() {
  return (
    <ul className="flex flex-col items-center gap-2">
      {NAV.map((item, i) => {
        const active = i === 0;
        const Icon = item.icon;
        if (item.primary) {
          return (
            <li key={item.label}>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-black">
                <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
              </span>
            </li>
          );
        }
        return (
          <li key={item.label}>
            <div
              className={cn(
                "flex flex-col items-center gap-0.5 py-1 px-1.5 rounded-lg",
                active ? "text-white bg-white/10" : "text-white/40"
              )}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={active ? 2.4 : 1.8} />
              <span className="text-[6px] font-medium tracking-wide">
                {item.label}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Variants
// ─────────────────────────────────────────────────────────────────────

function TopInline() {
  return (
    <>
      <div className="absolute inset-x-0 top-0 z-10">
        <MockTopBar />
        <div className="bg-black/80 backdrop-blur-md border-b border-white/5 px-2 py-1.5">
          <HorizontalTabs />
        </div>
      </div>
      <MockContent paddingTop={70} />
    </>
  );
}

function FloatingBottom() {
  return (
    <>
      <div className="absolute inset-x-0 top-0 z-10">
        <MockTopBar />
      </div>
      <MockContent paddingTop={28} paddingBottom={64} />
      <div className="absolute inset-x-3 bottom-3 z-10 rounded-2xl bg-black/70 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 px-2 py-2">
        <HorizontalTabs />
      </div>
    </>
  );
}

function SidePill({ align }: { align: "left" | "right" }) {
  return (
    <>
      <div className="absolute inset-x-0 top-0 z-10">
        <MockTopBar />
      </div>
      <MockContent paddingTop={28} paddingX={align === "right" ? 0 : 0} />
      <div
        className={cn(
          "absolute top-1/2 -translate-y-1/2 z-10 rounded-2xl bg-black/70 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 px-1.5 py-2",
          align === "right" ? "right-2" : "left-2"
        )}
      >
        <VerticalTabs />
      </div>
    </>
  );
}

function BottomSolid() {
  return (
    <>
      <div className="absolute inset-x-0 top-0 z-10">
        <MockTopBar />
      </div>
      <MockContent paddingTop={28} paddingBottom={48} />
      <div className="absolute inset-x-0 bottom-0 z-10 bg-black border-t border-white/5 px-2 py-2">
        <HorizontalTabs />
      </div>
    </>
  );
}

function TopNavOnly() {
  return (
    <>
      <div className="absolute inset-x-0 top-0 z-10 bg-black/80 backdrop-blur-md border-b border-white/5 px-2 py-2">
        <HorizontalTabs />
      </div>
      <MockContent paddingTop={42} paddingBottom={28} />
      <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between px-3 py-2 bg-black/80 backdrop-blur-md border-t border-white/5">
        <span className="font-heading text-xs uppercase tracking-tight text-white">
          Moidello
        </span>
        <span className="rounded-full bg-white text-black px-2 py-0.5 text-[7px] font-bold uppercase">
          Logga in
        </span>
      </div>
    </>
  );
}
