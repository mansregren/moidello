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

  async function handleGoogleSignIn() {
    if (pending) return;
    setPending(true);
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setPending(false);
      setErrorMessage(
        error.message.includes("Provider not enabled")
          ? "Google-inlogg är inte aktiverat ännu."
          : error.message,
      );
    }
    // On success the browser is redirected away; no need to setPending(false).
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
          <h1 className="font-heading text-[36px] md:text-[48px] leading-[0.95] uppercase tracking-[-0.02em] text-foreground">
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
          <>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={pending}
              className="w-full inline-flex items-center justify-center gap-3 rounded-full bg-foreground text-background px-5 py-3 text-sm font-medium hover:bg-foreground/90 transition-colors active:scale-[0.98] disabled:opacity-60"
            >
              <GoogleIcon className="h-4 w-4" />
              Fortsätt med Google
            </button>

            <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-wider text-foreground-subtle">
              <span className="flex-1 h-px bg-foreground/10" />
              eller
              <span className="flex-1 h-px bg-foreground/10" />
            </div>
          </>
        )}

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
                className="w-full rounded-xl bg-foreground/5 border border-foreground/10 px-4 py-3 text-foreground placeholder:text-foreground-subtle outline-none focus:border-foreground/30 transition-colors"
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
                className="text-foreground-muted hover:text-foreground underline"
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
                  className="w-full rounded-xl bg-foreground/5 border border-foreground/10 px-4 py-3 text-foreground placeholder:text-foreground-subtle outline-none focus:border-foreground/30 transition-colors"
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
                className="w-full rounded-xl bg-foreground/5 border border-foreground/10 px-4 py-3 text-center text-2xl tracking-[0.5em] text-foreground placeholder:text-foreground-subtle outline-none focus:border-foreground/30 transition-colors"
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
                className="text-foreground-muted hover:text-foreground underline"
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
                className="w-full rounded-xl bg-foreground/5 border border-foreground/10 px-4 py-3 text-foreground placeholder:text-foreground-subtle outline-none focus:border-foreground/30 transition-colors"
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
                className="w-full rounded-xl bg-foreground/5 border border-foreground/10 px-4 py-3 text-foreground placeholder:text-foreground-subtle outline-none focus:border-foreground/30 transition-colors"
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
                className="text-foreground-muted hover:text-foreground underline"
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

function GoogleIcon({ className }: { className?: string }) {
  // Google "G" mark — color values are the official brand palette.
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M21.6 12.227c0-.7-.063-1.373-.18-2.018H12v3.818h5.382a4.604 4.604 0 0 1-1.998 3.018v2.51h3.232c1.89-1.745 2.984-4.31 2.984-7.328Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.7 0 4.964-.895 6.616-2.445l-3.232-2.51c-.895.6-2.04.955-3.384.955-2.604 0-4.81-1.76-5.6-4.122H3.073v2.59A9.997 9.997 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.4 13.878a5.99 5.99 0 0 1 0-3.755V7.534H3.073a10 10 0 0 0 0 8.933L6.4 13.878Z"
        fill="#FBBC04"
      />
      <path
        d="M12 5.998c1.47 0 2.787.505 3.823 1.494l2.866-2.866C16.96 2.99 14.696 2 12 2A9.997 9.997 0 0 0 3.073 7.533L6.4 10.123C7.19 7.76 9.397 5.998 12 5.998Z"
        fill="#EA4335"
      />
    </svg>
  );
}
