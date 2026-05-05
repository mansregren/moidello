"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { UserAvatar } from "@/components/user/UserAvatar";
import { categories, users } from "@/lib/data";
import { useGender } from "@/lib/gender-context";
import { GenderFilter } from "@/lib/types";
import { cn } from "@/lib/utils";

type GenderChoice = GenderFilter;
type Step = 0 | 1 | 2;

const TOTAL_STEPS = 3;

export default function OnboardingPage() {
  const router = useRouter();
  const { setGender } = useGender();

  const [step, setStep] = useState<Step>(0);
  const [genderChoice, setGenderChoice] = useState<GenderChoice | null>(null);
  const [styles, setStyles] = useState<Set<string>>(new Set());
  const [following, setFollowing] = useState<Set<string>>(new Set());

  const finish = () => {
    if (genderChoice) {
      setGender(genderChoice);
    }
    router.push("/");
  };

  const next = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep((step + 1) as Step);
    } else {
      finish();
    }
  };

  const skip = () => next();

  const canContinue =
    (step === 0 && genderChoice !== null) ||
    (step === 1 && styles.size > 0) ||
    step === 2;

  return (
    <main className="min-h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 md:px-12 pt-6">
        <span className="font-heading text-2xl uppercase tracking-tight text-white">
          Moidello
        </span>
        <button
          onClick={skip}
          className="text-sm text-foreground-muted hover:text-white transition-colors"
        >
          Hoppa över
        </button>
      </header>

      {/* Progress */}
      <div className="px-6 md:px-12 mt-6">
        <div className="flex gap-2">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-300",
                i <= step ? "bg-white" : "bg-border"
              )}
            />
          ))}
        </div>
        <p className="mt-3 text-xs text-foreground-subtle">
          Steg {step + 1} av {TOTAL_STEPS}
        </p>
      </div>

      <Container className="flex-1 flex flex-col py-10 md:py-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col"
          >
            {step === 0 && (
              <StepGender
                value={genderChoice}
                onChange={setGenderChoice}
              />
            )}
            {step === 1 && (
              <StepStyles value={styles} onChange={setStyles} />
            )}
            {step === 2 && (
              <StepFollow value={following} onChange={setFollowing} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer actions */}
        <div className="mt-10 flex items-center justify-between gap-4">
          <button
            onClick={skip}
            className="text-sm text-foreground-muted hover:text-white transition-colors"
          >
            Hoppa över detta steg
          </button>
          <button
            onClick={next}
            disabled={!canContinue}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all duration-300 active:scale-95",
              canContinue
                ? "bg-white text-black hover:bg-white/90"
                : "bg-background-tertiary text-foreground-subtle cursor-not-allowed"
            )}
          >
            {step === TOTAL_STEPS - 1 ? "Kom igång" : "Fortsätt"}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </Container>
    </main>
  );
}

function StepGender({
  value,
  onChange,
}: {
  value: GenderChoice | null;
  onChange: (v: GenderChoice) => void;
}) {
  const options: { id: GenderChoice; label: string }[] = [
    { id: "dam", label: "Dam" },
    { id: "herr", label: "Herr" },
    { id: "both", label: "Båda" },
  ];

  return (
    <div className="flex flex-col">
      <h1 className="font-heading text-[40px] md:text-[64px] leading-[0.95] uppercase tracking-[-0.02em] text-white">
        Vad vill du se?
      </h1>
      <p className="mt-3 text-foreground-muted">
        Välj vad du vill upptäcka. Du kan ändra detta senare.
      </p>

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {options.map((opt) => {
          const active = value === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onChange(opt.id)}
              aria-pressed={active}
              className={cn(
                "relative rounded-2xl border p-8 text-left transition-all duration-300 active:scale-[0.98]",
                active
                  ? "bg-white text-black border-white"
                  : "border-border text-white hover:border-white/30 bg-background-secondary"
              )}
            >
              <span className="font-heading text-3xl uppercase tracking-tight">
                {opt.label}
              </span>
              {active && (
                <Check className="absolute top-4 right-4 h-5 w-5" strokeWidth={2.5} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepStyles({
  value,
  onChange,
}: {
  value: Set<string>;
  onChange: (v: Set<string>) => void;
}) {
  const toggle = (style: string) => {
    const next = new Set(value);
    if (next.has(style)) {
      next.delete(style);
    } else {
      next.add(style);
    }
    onChange(next);
  };

  return (
    <div className="flex flex-col">
      <h1 className="font-heading text-[40px] md:text-[64px] leading-[0.95] uppercase tracking-[-0.02em] text-white">
        Välj stilar
      </h1>
      <p className="mt-3 text-foreground-muted">
        Välj minst en stil — vi anpassar ditt feed efter det.
      </p>

      <div className="mt-10 flex flex-wrap gap-3">
        {categories.map((cat) => {
          const active = value.has(cat);
          return (
            <button
              key={cat}
              onClick={() => toggle(cat)}
              aria-pressed={active}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition-all duration-300 active:scale-95",
                active
                  ? "bg-white text-black"
                  : "border border-border text-foreground-muted hover:text-white hover:border-white/30"
              )}
            >
              {active && <Check className="h-3.5 w-3.5" strokeWidth={2.5} />}
              {cat}
            </button>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-foreground-subtle">
        {value.size === 0
          ? "Ingen vald än"
          : `${value.size} ${value.size === 1 ? "stil" : "stilar"} valda`}
      </p>
    </div>
  );
}

function StepFollow({
  value,
  onChange,
}: {
  value: Set<string>;
  onChange: (v: Set<string>) => void;
}) {
  const suggested = users.slice(0, 6);

  const toggle = (id: string) => {
    const next = new Set(value);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onChange(next);
  };

  return (
    <div className="flex flex-col">
      <h1 className="font-heading text-[40px] md:text-[64px] leading-[0.95] uppercase tracking-[-0.02em] text-white">
        Följ kreatörer
      </h1>
      <p className="mt-3 text-foreground-muted">
        Här är några vi tror du gillar. Följ för att se deras outfits i ditt feed.
      </p>

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {suggested.map((user) => {
          const active = value.has(user.id);
          return (
            <div
              key={user.id}
              className={cn(
                "flex items-center gap-3 rounded-2xl border p-4 transition-colors duration-300",
                active ? "border-white/40 bg-white/5" : "border-border bg-background-secondary"
              )}
            >
              <UserAvatar
                src={user.avatar}
                alt={user.displayName}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.displayName}
                </p>
                <p className="text-xs text-foreground-subtle truncate">
                  @{user.username} · {user.followers.toLocaleString("sv-SE")} följare
                </p>
              </div>
              <button
                onClick={() => toggle(user.id)}
                aria-pressed={active}
                className={cn(
                  "shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-300 active:scale-95",
                  active
                    ? "bg-white text-black"
                    : "border border-border text-white hover:border-white/40"
                )}
              >
                {active ? "Följer" : "Följ"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
