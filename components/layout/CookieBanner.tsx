"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

const CONSENT_COOKIE = "moidello_cookie_consent";

function hasConsent(): boolean {
  if (typeof document === "undefined") return true;
  return document.cookie
    .split(";")
    .some((c) => c.trim().startsWith(`${CONSENT_COOKIE}=`));
}

function setConsent(value: "accepted" | "essential") {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 365; // 1 year
  const attrs = [
    `${CONSENT_COOKIE}=${value}`,
    "path=/",
    `max-age=${maxAge}`,
    "samesite=lax",
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "secure"
      : "",
  ]
    .filter(Boolean)
    .join("; ");
  document.cookie = attrs;
}

/**
 * Minimal cookie consent banner. Moidello only sets functional cookies
 * (auth, region, viewer-token, bg-seed) — none track across sites — so
 * we present a single "OK"-style notice and a link to the privacy
 * policy rather than a heavy consent matrix.
 */
export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!hasConsent()) {
      // Tiny delay so it doesn't flash on the very first paint.
      const t = setTimeout(() => setVisible(true), 400);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = (value: "accepted" | "essential") => {
    setConsent(value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie-information"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-[55] rounded-2xl border border-white/10 bg-background-secondary/95 backdrop-blur-xl shadow-2xl p-5"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-heading text-sm uppercase tracking-wider text-white mb-2">
            Cookies på Moidello
          </p>
          <p className="text-xs text-foreground-muted leading-relaxed">
            Vi använder cookies för att hålla dig inloggad, komma ihåg din
            region och förbättra prestanda. Inga tredjeparts-spårningsko­okies.
            Läs mer i vår{" "}
            <Link
              href="/integritet"
              className="text-white underline hover:text-white/80"
            >
              integritetspolicy
            </Link>
            .
          </p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => dismiss("essential")}
              className="rounded-full border border-border text-white px-3 py-1.5 text-xs hover:border-white/30"
            >
              Endast nödvändiga
            </button>
            <button
              type="button"
              onClick={() => dismiss("accepted")}
              className="rounded-full bg-white text-black px-4 py-1.5 text-xs font-semibold hover:bg-white/90"
            >
              OK
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => dismiss("essential")}
          aria-label="Stäng"
          className="shrink-0 text-foreground-muted hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
