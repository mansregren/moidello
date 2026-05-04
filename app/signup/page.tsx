"use client";

import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { motion } from "framer-motion";

export default function SignupPage() {
  return (
    <>
      <Header />
      <main className="relative flex-1 flex items-center justify-center min-h-screen px-6">
        <div className="absolute inset-0">
          <Image src="/images/bg/boats.jpg" alt="" fill className="object-cover" />
          <div className="absolute inset-0 bg-black/60" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="glass-strong rounded-3xl p-8 md:p-10">
            <div className="text-center mb-8">
              <h1 className="font-heading text-[36px] md:text-[48px] leading-[0.95] uppercase tracking-[-0.02em] text-white">
                Skapa konto
              </h1>
              <p className="text-foreground-muted mt-2 text-sm">
                Gå med i Moidello och dela din stil
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground-muted block mb-2">
                    Förnamn
                  </label>
                  <input
                    type="text"
                    placeholder="Anna"
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-foreground-subtle outline-none focus:border-white/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground-muted block mb-2">
                    Efternamn
                  </label>
                  <input
                    type="text"
                    placeholder="Svensson"
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-foreground-subtle outline-none focus:border-white/30 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground-muted block mb-2">
                  Användarnamn
                </label>
                <input
                  type="text"
                  placeholder="@annastyle"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-foreground-subtle outline-none focus:border-white/30 transition-colors"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground-muted block mb-2">
                  E-post
                </label>
                <input
                  type="email"
                  placeholder="din@email.se"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-foreground-subtle outline-none focus:border-white/30 transition-colors"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground-muted block mb-2">
                  Lösenord
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-foreground-subtle outline-none focus:border-white/30 transition-colors"
                />
              </div>

              <PremiumButton className="w-full mt-2" size="lg">
                Skapa konto
              </PremiumButton>
            </div>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-transparent px-4 text-foreground-subtle">
                  eller registrera med
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <button className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-3">
                <span className="text-lg">🍎</span>
                Registrera med Apple
              </button>
              <button className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-3">
                <span className="text-lg">G</span>
                Registrera med Google
              </button>
            </div>

            <p className="mt-8 text-center text-sm text-foreground-subtle">
              Har du redan ett konto?{" "}
              <Link
                href="/login"
                className="text-white hover:underline"
              >
                Logga in
              </Link>
            </p>
          </div>
        </motion.div>
      </main>
    </>
  );
}
