"use client";

import Image from "next/image";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <>
      <Header />
      <main
        id="main"
        tabIndex={-1}
        className="relative flex-1 flex items-center justify-center min-h-screen px-6"
      >
        <div className="absolute inset-0">
          <Image
            src="/images/bg/riviera.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </main>
    </>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const initialError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    initialError ? "error" : "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string>(
    initialError ? "Inloggningslänken kunde inte verifieras. Försök igen." : "",
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || status === "sending") return;

    setStatus("sending");
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    setStatus("sent");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-md"
    >
      <div className="glass-strong rounded-3xl p-8 md:p-10">
        <div className="text-center mb-8">
          <h1 className="font-heading text-[36px] md:text-[48px] leading-[0.95] uppercase tracking-[-0.02em] text-white">
            {status === "sent" ? "Kolla din inkorg" : "Logga in"}
          </h1>
          <p className="text-foreground-muted mt-2 text-sm">
            {status === "sent"
              ? `Vi har skickat en inloggningslänk till ${email}.`
              : "Skriv din e-post — vi skickar en magisk länk."}
          </p>
        </div>

        {status !== "sent" && (
          <form onSubmit={handleSubmit} className="space-y-4">
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

            {status === "error" && errorMessage && (
              <p className="text-sm text-red-400">{errorMessage}</p>
            )}

            <PremiumButton
              type="submit"
              className="w-full mt-2"
              size="lg"
              disabled={status === "sending" || !email}
            >
              {status === "sending" ? "Skickar…" : "Skicka inloggningslänk"}
            </PremiumButton>
          </form>
        )}

        {status === "sent" && (
          <p className="text-center text-sm text-foreground-muted">
            Stäng inte den här fliken förrän du klickat på länken i mailet.
          </p>
        )}
      </div>
    </motion.div>
  );
}
