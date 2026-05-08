"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { createClient } from "@/lib/supabase/client";

type Phase = "email" | "code" | "password";

export default function LoginForm({ initialError }: { initialError?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [phase, setPhase] = useState<Phase>(initialError ? "code" : "email");
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>(
    initialError
      ? "Inloggningslänken kunde inte verifieras. Skriv 6-siffrig kod nedan istället."
      : "",
  );

  async function navigateAfterSignIn(userId: string) {
    const supabase = createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .maybeSingle();

    router.refresh();
    if (profile?.username?.startsWith("user_")) {
      router.push("/onboarding");
    } else {
      router.push("/upptack");
    }
  }

  async function handleSendLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || pending) return;

    setPending(true);
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setPending(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setPhase("code");
  }

  async function handleVerifyCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || code.length !== 6 || pending) return;

    setPending(true);
    setErrorMessage("");

    const supabase = createClient();
    const { error, data } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });

    if (error || !data.session) {
      setPending(false);
      setErrorMessage(error?.message ?? "Koden är ogiltig eller har gått ut.");
      return;
    }

    await navigateAfterSignIn(data.session.user.id);
  }

  async function handlePasswordSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || !password || pending) return;

    setPending(true);
    setErrorMessage("");

    const supabase = createClient();
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      setPending(false);
      setErrorMessage(error?.message ?? "Fel e-post eller lösenord.");
      return;
    }

    await navigateAfterSignIn(data.session.user.id);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-md relative z-10"
    >
      <div className="glass-strong rounded-3xl p-8 md:p-10">
        <div className="text-center mb-8">
          <h1 className="font-heading text-[36px] md:text-[48px] leading-[0.95] uppercase tracking-[-0.02em] text-white">
            {phase === "code" ? "Kolla din inkorg" : "Logga in"}
          </h1>
          <p className="text-foreground-muted mt-2 text-sm">
            {phase === "code"
              ? `Vi har mailat dig en länk + 6-siffrig kod${email ? ` till ${email}` : ""}.`
              : phase === "password"
                ? "Skriv din e-post och lösenord."
                : "Skriv din e-post — vi skickar en magisk länk."}
          </p>
        </div>

        {phase === "email" && (
          <form onSubmit={handleSendLink} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="text-sm font-medium text-foreground-muted block mb-2"
              >
                E-post
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="din@email.se"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-foreground-subtle outline-none focus:border-white/30 transition-colors"
              />
            </div>

            {errorMessage && (
              <p className="text-sm text-red-400">{errorMessage}</p>
            )}

            <PremiumButton
              type="submit"
              className="w-full mt-2"
              size="lg"
              disabled={pending || !email}
            >
              {pending ? "Skickar…" : "Skicka inloggningslänk"}
            </PremiumButton>

            <p className="text-center text-xs text-foreground-subtle pt-2">
              <button
                type="button"
                onClick={() => {
                  setPhase("password");
                  setErrorMessage("");
                }}
                className="text-foreground-muted hover:text-white underline"
              >
                Logga in med lösenord istället
              </button>
            </p>
          </form>
        )}

        {phase === "code" && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            {!email && (
              <div>
                <label
                  htmlFor="email-verify"
                  className="text-sm font-medium text-foreground-muted block mb-2"
                >
                  E-post
                </label>
                <input
                  id="email-verify"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="din@email.se"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-foreground-subtle outline-none focus:border-white/30 transition-colors"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="otp-code"
                className="text-sm font-medium text-foreground-muted block mb-2"
              >
                6-siffrig kod
              </label>
              <input
                id="otp-code"
                type="text"
                required
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="••••••"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-center text-2xl tracking-[0.5em] text-white placeholder:text-foreground-subtle outline-none focus:border-white/30 transition-colors"
              />
            </div>

            {errorMessage && (
              <p className="text-sm text-red-400">{errorMessage}</p>
            )}

            <PremiumButton
              type="submit"
              className="w-full mt-2"
              size="lg"
              disabled={pending || code.length !== 6 || !email}
            >
              {pending ? "Verifierar…" : "Logga in"}
            </PremiumButton>

            <p className="text-center text-xs text-foreground-subtle pt-2">
              Får du inget mail? Kolla skräpkorgen.{" "}
              <button
                type="button"
                onClick={() => {
                  setPhase("email");
                  setCode("");
                  setErrorMessage("");
                }}
                className="text-foreground-muted hover:text-white underline"
              >
                Använd annan e-post
              </button>
            </p>
          </form>
        )}

        {phase === "password" && (
          <form onSubmit={handlePasswordSignIn} className="space-y-4">
            <div>
              <label
                htmlFor="email-pw"
                className="text-sm font-medium text-foreground-muted block mb-2"
              >
                E-post
              </label>
              <input
                id="email-pw"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="din@email.se"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-foreground-subtle outline-none focus:border-white/30 transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="text-sm font-medium text-foreground-muted block mb-2"
              >
                Lösenord
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-foreground-subtle outline-none focus:border-white/30 transition-colors"
              />
            </div>

            {errorMessage && (
              <p className="text-sm text-red-400">{errorMessage}</p>
            )}

            <PremiumButton
              type="submit"
              className="w-full mt-2"
              size="lg"
              disabled={pending || !email || !password}
            >
              {pending ? "Loggar in…" : "Logga in"}
            </PremiumButton>

            <p className="text-center text-xs text-foreground-subtle pt-2">
              <button
                type="button"
                onClick={() => {
                  setPhase("email");
                  setPassword("");
                  setErrorMessage("");
                }}
                className="text-foreground-muted hover:text-white underline"
              >
                Tillbaka till magisk länk
              </button>
            </p>
          </form>
        )}
      </div>
    </motion.div>
  );
}
