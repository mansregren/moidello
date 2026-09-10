"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell, BellOff } from "lucide-react";
import { subscribePush, unsubscribePush } from "@/app/actions/push";

// Web Push expects the VAPID public key as a Uint8Array.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function PushToggle() {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    const isSupported =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;

    if (!isSupported) {
      setSupported(false);
      return;
    }
    setSupported(true);

    (async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration("/sw.js");
        if (!reg) {
          setEnabled(false);
          return;
        }
        const sub = await reg.pushManager.getSubscription();
        setEnabled(!!sub);
      } catch {
        setEnabled(false);
      }
    })();
  }, []);

  const handleEnable = () => {
    setError(null);
    if (!vapidPublicKey) {
      setError(
        "Push notifications aren’t configured yet.",
      );
      return;
    }

    startTransition(async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setError("Permission denied. Enable it in your browser settings.");
          return;
        }

        const reg =
          (await navigator.serviceWorker.getRegistration("/sw.js")) ??
          (await navigator.serviceWorker.register("/sw.js"));

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            vapidPublicKey,
          ) as BufferSource,
        });

        const json = sub.toJSON();
        const res = await subscribePush(
          {
            endpoint: json.endpoint!,
            keys: {
              p256dh: json.keys!.p256dh,
              auth: json.keys!.auth,
            },
          },
          navigator.userAgent,
        );

        if (!res.ok) {
          setError(res.error);
          await sub.unsubscribe();
          return;
        }
        setEnabled(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  };

  const handleDisable = () => {
    setError(null);
    startTransition(async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration("/sw.js");
        const sub = await reg?.pushManager.getSubscription();
        if (sub) {
          await unsubscribePush(sub.endpoint);
          await sub.unsubscribe();
        }
        setEnabled(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  };

  if (supported === null) return null;

  return (
    <section className="rounded-2xl border border-border bg-background-secondary p-6 md:p-8">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
          {enabled ? (
            <Bell className="h-4 w-4" />
          ) : (
            <BellOff className="h-4 w-4" />
          )}
        </div>
        <div className="flex-1">
          <h2 className="font-heading text-xl uppercase tracking-tight text-foreground">
            Push-notiser
          </h2>
          <p className="mt-2 text-sm text-foreground-muted">
            {supported === false
              ? "Your browser doesn’t support push notifications. On iPhone the app must be installed (add to home screen)."
              : enabled
                ? "Active on this device. You’ll get notifications even when Moidello is closed."
                : "Get notified about followers, comments and messages straight to your device."}
          </p>

          {supported && (
            <button
              type="button"
              disabled={pending}
              onClick={enabled ? handleDisable : handleEnable}
              className={
                enabled
                  ? "mt-5 inline-flex items-center gap-2 rounded-full border border-border text-foreground px-5 py-2.5 text-sm font-semibold hover:border-foreground/30 disabled:opacity-60"
                  : "mt-5 inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:bg-foreground/90 disabled:opacity-60"
              }
            >
              {pending
                ? "Wait…"
                : enabled
                  ? "Turn off push notifications"
                  : "Turn on push notifications"}
            </button>
          )}

          {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
        </div>
      </div>
    </section>
  );
}
