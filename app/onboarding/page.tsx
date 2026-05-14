"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { UserAvatar } from "@/components/user/UserAvatar";
import { categories, users } from "@/lib/data";
import { useGender } from "@/lib/gender-context";
import { useAuth } from "@/lib/auth-context";
import { GenderFilter } from "@/lib/types";
import { cn } from "@/lib/utils";
import { completeOnboarding, type OnboardingState } from "./actions";

type GenderChoice = GenderFilter;
type Step = 0 | 1 | 2 | 3;

const TOTAL_STEPS = 4;
const initialState: OnboardingState = {};

export default function OnboardingPage() {
  const router = useRouter();
  const { isLoggedIn, loading, user } = useAuth();
  const { setGender } = useGender();

  const [step, setStep] = useState<Step>(0);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");

  // Prefill from OAuth provider metadata (Google: full_name / name). Reset
  // when a different user signs in mid-page so we don't carry over the
  // previous account's prefill.
  const lastUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!user) return;
    const switched = lastUserIdRef.current !== null && lastUserIdRef.current !== user.id;
    lastUserIdRef.current = user.id;

    const meta = user.user_metadata ?? {};
    const guess =
      (typeof meta.full_name === "string" && meta.full_name) ||
      (typeof meta.name === "string" && meta.name) ||
      "";

    if (switched) {
      // New user — wipe any state from the previous one.
      setDisplayName(guess);
      setUsername("");
    } else if (guess && !displayName) {
      setDisplayName(guess);
    }

    if (!username && user.email) {
      const local = user.email.split("@")[0] ?? "";
      const cleaned = local.toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 24);
      if (cleaned.length >= 3) setUsername(cleaned);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
  const [genderChoice, setGenderChoice] = useState<GenderChoice | null>(null);
  const [styles, setStyles] = useState<Set<string>>(new Set());
  const [following, setFollowing] = useState<Set<string>>(new Set());

  const [state, formAction, pending] = useActionState(
    completeOnboarding,
    initialState,
  );

  useEffect(() => {
    if (!loading && !isLoggedIn) {
      router.push("/login");
    }
  }, [loading, isLoggedIn, router]);

  const next = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep((step + 1) as Step);
    }
  };

  const skip = () => {
    if (step === 0) return; // username can't be skipped
    next();
  };

  const usernameValid = /^[a-z0-9_]{3,24}$/.test(username);

  const canContinue =
    (step === 0 && usernameValid) ||
    (step === 1 && genderChoice !== null) ||
    (step === 2 && styles.size > 0) ||
    step === 3;

  const onContinue = () => {
    if (step === 1 && genderChoice) setGender(genderChoice);
    next();
  };

  if (loading || !isLoggedIn) {
    return null;
  }

  return (
    <main
      id="main"
      tabIndex={-1}
      className="min-h-screen flex flex-col bg-background"
    >
      <header className="flex items-center justify-between px-6 md:px-12 pt-6">
        <span className="font-heading text-2xl uppercase tracking-tight text-foreground">
          Moidello
        </span>
        {step > 0 && step < TOTAL_STEPS - 1 && (
          <button
            onClick={skip}
            className="text-sm text-foreground-muted hover:text-foreground transition-colors"
          >
            Hoppa över
          </button>
        )}
      </header>

      <div className="px-6 md:px-12 mt-6">
        <div className="flex gap-2">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-300",
                i <= step ? "bg-foreground" : "bg-border",
              )}
            />
          ))}
        </div>
        <p className="mt-3 text-xs text-foreground-subtle">
          Steg {step + 1} av {TOTAL_STEPS}
        </p>
      </div>

      <Container className="flex-1 flex flex-col py-10 md:py-16">
        <form
          action={formAction}
          className="flex-1 flex flex-col"
          onSubmit={(e) => {
            if (step !== TOTAL_STEPS - 1) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="username" value={username} />
          <input type="hidden" name="display_name" value={displayName} />
          <input
            type="hidden"
            name="follow_ids"
            value={JSON.stringify(Array.from(following))}
          />

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
                <StepUsername
                  username={username}
                  onUsernameChange={setUsername}
                  displayName={displayName}
                  onDisplayNameChange={setDisplayName}
                  fieldError={state.fieldErrors?.username}
                />
              )}
              {step === 1 && (
                <StepGender value={genderChoice} onChange={setGenderChoice} />
              )}
              {step === 2 && <StepStyles value={styles} onChange={setStyles} />}
              {step === 3 && (
                <StepFollow value={following} onChange={setFollowing} />
              )}
            </motion.div>
          </AnimatePresence>

          {state.error && (
            <p className="mt-4 text-sm text-red-400">{state.error}</p>
          )}

          <div className="mt-10 flex items-center justify-between gap-4">
            {step > 0 && step < TOTAL_STEPS - 1 ? (
              <button
                type="button"
                onClick={skip}
                className="text-sm text-foreground-muted hover:text-foreground transition-colors"
              >
                Hoppa över detta steg
              </button>
            ) : (
              <span />
            )}

            {step === TOTAL_STEPS - 1 ? (
              <button
                type="submit"
                disabled={pending || !usernameValid}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all duration-300 active:scale-95",
                  pending || !usernameValid
                    ? "bg-background-tertiary text-foreground-subtle cursor-not-allowed"
                    : "bg-foreground text-background hover:bg-foreground/90",
                )}
              >
                {pending ? "Sparar…" : "Kom igång"}
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onContinue}
                disabled={!canContinue}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all duration-300 active:scale-95",
                  canContinue
                    ? "bg-foreground text-background hover:bg-foreground/90"
                    : "bg-background-tertiary text-foreground-subtle cursor-not-allowed",
                )}
              >
                Fortsätt
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </form>
      </Container>
    </main>
  );
}

function StepUsername({
  username,
  onUsernameChange,
  displayName,
  onDisplayNameChange,
  fieldError,
}: {
  username: string;
  onUsernameChange: (v: string) => void;
  displayName: string;
  onDisplayNameChange: (v: string) => void;
  fieldError?: string;
}) {
  return (
    <div className="flex flex-col">
      <h1 className="font-heading text-[40px] md:text-[64px] leading-[0.95] uppercase tracking-[-0.02em] text-foreground">
        Välj användarnamn
      </h1>
      <p className="mt-3 text-foreground-muted">
        Det här är hur andra hittar dig på Moidello.
      </p>

      <div className="mt-10 space-y-5 max-w-md">
        <div>
          <label
            htmlFor="username-input"
            className="text-sm font-medium text-foreground-muted block mb-2"
          >
            Användarnamn
          </label>
          <div className="flex items-center rounded-xl bg-background-secondary border border-border focus-within:border-foreground/30 transition-colors overflow-hidden">
            <span className="px-4 text-foreground-subtle">@</span>
            <input
              id="username-input"
              type="text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              inputMode="text"
              maxLength={24}
              value={username}
              onChange={(e) =>
                onUsernameChange(e.target.value.toLowerCase().replace(/\s+/g, ""))
              }
              placeholder="dittnamn"
              className="flex-1 bg-transparent border-0 px-0 py-3 text-foreground placeholder:text-foreground-subtle outline-none"
            />
          </div>
          <p className="mt-2 text-xs text-foreground-subtle">
            3–24 tecken: små bokstäver, siffror, understreck.
          </p>
          {fieldError && (
            <p className="mt-2 text-xs text-red-400">{fieldError}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="display-name-input"
            className="text-sm font-medium text-foreground-muted block mb-2"
          >
            Visningsnamn (valfritt)
          </label>
          <input
            id="display-name-input"
            type="text"
            maxLength={50}
            value={displayName}
            onChange={(e) => onDisplayNameChange(e.target.value)}
            placeholder="T.ex. Anna Svensson"
            className="w-full rounded-xl bg-background-secondary border border-border px-4 py-3 text-foreground placeholder:text-foreground-subtle outline-none focus:border-foreground/30 transition-colors"
          />
        </div>
      </div>
    </div>
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
  ];

  return (
    <div className="flex flex-col">
      <h1 className="font-heading text-[40px] md:text-[64px] leading-[0.95] uppercase tracking-[-0.02em] text-foreground">
        Vad vill du se?
      </h1>
      <p className="mt-3 text-foreground-muted">
        Välj vad du vill upptäcka. Du kan ändra detta senare.
      </p>

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((opt) => {
          const active = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              aria-pressed={active}
              className={cn(
                "relative rounded-2xl border p-8 text-left transition-all duration-300 active:scale-[0.98]",
                active
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-foreground hover:border-foreground/30 bg-background-secondary",
              )}
            >
              <span className="font-heading text-3xl uppercase tracking-tight">
                {opt.label}
              </span>
              {active && (
                <Check
                  className="absolute top-4 right-4 h-5 w-5"
                  strokeWidth={2.5}
                />
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
    if (next.has(style)) next.delete(style);
    else next.add(style);
    onChange(next);
  };

  return (
    <div className="flex flex-col">
      <h1 className="font-heading text-[40px] md:text-[64px] leading-[0.95] uppercase tracking-[-0.02em] text-foreground">
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
              type="button"
              onClick={() => toggle(cat)}
              aria-pressed={active}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition-all duration-300 active:scale-95",
                active
                  ? "bg-foreground text-background"
                  : "border border-border text-foreground-muted hover:text-foreground hover:border-foreground/30",
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
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  };

  return (
    <div className="flex flex-col">
      <h1 className="font-heading text-[40px] md:text-[64px] leading-[0.95] uppercase tracking-[-0.02em] text-foreground">
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
                active
                  ? "border-foreground/40 bg-foreground/5"
                  : "border-border bg-background-secondary",
              )}
            >
              <UserAvatar
                src={user.avatar}
                alt={user.displayName}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.displayName}
                </p>
                <p className="text-xs text-foreground-subtle truncate">
                  @{user.username} ·{" "}
                  {user.followers.toLocaleString("sv-SE")} följare
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggle(user.id)}
                aria-pressed={active}
                className={cn(
                  "shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-300 active:scale-95",
                  active
                    ? "bg-foreground text-background"
                    : "border border-border text-foreground hover:border-foreground/40",
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
