"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Stage =
  | { kind: "loading" }
  | { kind: "off" }
  | { kind: "on"; factorId: string }
  | {
      kind: "enrolling";
      factorId: string;
      qr: string;
      secret: string;
      uri: string;
    };

const INPUT =
  "w-full rounded-xl bg-background-tertiary border border-border text-sm text-foreground placeholder:text-foreground-subtle p-3 outline-none focus:border-foreground/30";

export function TwoFactorSettings() {
  const [stage, setStage] = useState<Stage>({ kind: "loading" });
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const reload = async () => {
    setError(null);
    const supabase = createClient();
    const { data, error: listError } = await supabase.auth.mfa.listFactors();
    if (listError) {
      setError(listError.message);
      setStage({ kind: "off" });
      return;
    }
    const totp = data?.totp ?? [];
    const verified = totp.find((f) => f.status === "verified");
    if (verified) {
      setStage({ kind: "on", factorId: verified.id });
      return;
    }
    // Drop any orphaned unverified factors so the next enroll starts clean.
    for (const f of totp.filter((f) => f.status !== "verified")) {
      await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
    setStage({ kind: "off" });
  };

  useEffect(() => {
    void reload();
  }, []);

  const startEnroll = async () => {
    setBusy(true);
    setError(null);
    setInfo(null);
    const supabase = createClient();
    const { data, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: `Moidello (${new Date().toISOString().slice(0, 10)})`,
    });
    setBusy(false);
    if (enrollError || !data) {
      setError(enrollError?.message ?? "Could not start enrollment.");
      return;
    }
    setStage({
      kind: "enrolling",
      factorId: data.id,
      qr: data.totp.qr_code,
      secret: data.totp.secret,
      uri: data.totp.uri,
    });
  };

  const cancelEnroll = async () => {
    if (stage.kind !== "enrolling") return;
    setBusy(true);
    const supabase = createClient();
    await supabase.auth.mfa.unenroll({ factorId: stage.factorId });
    setBusy(false);
    setCode("");
    await reload();
  };

  const verifyEnroll = async () => {
    if (stage.kind !== "enrolling") return;
    const digits = code.replace(/\D/g, "");
    if (digits.length !== 6) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { data: challengeData, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId: stage.factorId });
    if (challengeError || !challengeData) {
      setBusy(false);
      setError(challengeError?.message ?? "Could not create a challenge.");
      return;
    }
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: stage.factorId,
      challengeId: challengeData.id,
      code: digits,
    });
    setBusy(false);
    if (verifyError) {
      setError(verifyError.message);
      return;
    }
    setCode("");
    setInfo("2FA enabled. Your next login will require a code.");
    await reload();
  };

  const disable = async () => {
    if (stage.kind !== "on") return;
    if (
      !confirm(
        "Disable 2FA? You’ll be able to log in without a code after this.",
      )
    )
      return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error: unenrollError } = await supabase.auth.mfa.unenroll({
      factorId: stage.factorId,
    });
    setBusy(false);
    if (unenrollError) {
      setError(unenrollError.message);
      return;
    }
    setInfo("2FA disabled.");
    await reload();
  };

  return (
    <section className="rounded-2xl border border-border bg-background-secondary p-6 md:p-8">
      <div className="flex items-start gap-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            stage.kind === "on" ? "bg-emerald-500 text-background" : "bg-foreground text-background"
          }`}
        >
          {stage.kind === "on" ? (
            <ShieldCheck className="h-4 w-4" />
          ) : (
            <ShieldAlert className="h-4 w-4" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-heading text-xl uppercase tracking-tight text-foreground">
            Two-factor authentication
          </h2>
          <p className="mt-1 text-sm text-foreground-muted">
            {stage.kind === "on"
              ? "2FA is enabled on your account."
              : "Add an extra layer of security with an authenticator app (Google Authenticator, Authy, 1Password)."}
          </p>

          {stage.kind === "loading" && (
            <p className="mt-4 inline-flex items-center gap-2 text-sm text-foreground-subtle">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading status…
            </p>
          )}

          {stage.kind === "off" && (
            <button
              type="button"
              onClick={startEnroll}
              disabled={busy}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-foreground text-background px-4 py-2 text-sm font-semibold hover:bg-foreground/90 disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              Enable 2FA
            </button>
          )}

          {stage.kind === "on" && (
            <button
              type="button"
              onClick={disable}
              disabled={busy}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-red-500/30 text-red-400 px-4 py-2 text-sm font-semibold hover:bg-red-500/10 disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Disable 2FA
            </button>
          )}

          {stage.kind === "enrolling" && (
            <div className="mt-5 space-y-4">
              <div>
                <p className="text-sm font-medium text-foreground">
                  1. Scan the QR code with your authenticator app
                </p>
                <div className="mt-3 inline-block rounded-xl bg-foreground p-3">
                  {/* Supabase returns the QR as a data:image/svg+xml URI */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={stage.qr}
                    alt="2FA QR code"
                    className="block h-44 w-44"
                  />
                </div>
                <p className="mt-3 text-xs text-foreground-subtle">
                  Can’t scan? Enter this code manually:
                </p>
                <code className="mt-1 inline-block break-all rounded-md bg-background-tertiary px-2 py-1 text-xs text-foreground-muted">
                  {stage.secret}
                </code>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground">
                  2. Confirm with a 6-digit code from the app
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="123456"
                  className={`${INPUT} mt-2 tabular-nums tracking-[0.4em] text-center text-lg`}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={verifyEnroll}
                  disabled={busy || code.length !== 6}
                  className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-4 py-2 text-sm font-semibold hover:bg-foreground/90 disabled:opacity-60"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  Enable
                </button>
                <button
                  type="button"
                  onClick={cancelEnroll}
                  disabled={busy}
                  className="inline-flex items-center rounded-full border border-border text-foreground-muted px-4 py-2 text-sm font-semibold hover:text-foreground hover:border-foreground/30 disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
          {info && <p className="mt-3 text-xs text-emerald-300">{info}</p>}
        </div>
      </div>
    </section>
  );
}
