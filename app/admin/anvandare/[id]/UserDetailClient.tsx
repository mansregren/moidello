"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Upload, Save } from "lucide-react";
import {
  updateUserProfile,
  uploadUserAvatar,
} from "@/app/actions/admin-users";

export interface FullUserRow {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  region: string | null;
  account_type: "creator" | "brand" | null;
  brand_name: string | null;
  brand_website: string | null;
  instagram: string | null;
  tiktok: string | null;
  youtube: string | null;
  website: string | null;
  contact_email: string | null;
  is_admin: boolean;
  is_demo: boolean;
  created_at: string;
}

export function UserDetailClient({ user }: { user: FullUserRow }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    username: user.username,
    display_name: user.display_name ?? "",
    bio: user.bio ?? "",
    region: user.region ?? "",
    account_type: (user.account_type ?? "creator") as "creator" | "brand",
    brand_name: user.brand_name ?? "",
    brand_website: user.brand_website ?? "",
    instagram: user.instagram ?? "",
    tiktok: user.tiktok ?? "",
    youtube: user.youtube ?? "",
    website: user.website ?? "",
  });

  const set = <K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await updateUserProfile(user.id, {
        username: form.username,
        display_name: form.display_name || null,
        bio: form.bio || null,
        region: form.region || null,
        account_type: form.account_type,
        brand_name: form.brand_name || null,
        brand_website: form.brand_website || null,
        instagram: form.instagram || null,
        tiktok: form.tiktok || null,
        youtube: form.youtube || null,
        website: form.website || null,
      });
      if (res.ok) {
        setSuccess("Sparat.");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  const handleAvatarFile = async (file: File) => {
    setError(null);
    setSuccess(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("avatar", file);
      const res = await uploadUserAvatar(user.id, fd);
      if (res.ok) {
        setSuccess("Avatar uppdaterad.");
        router.refresh();
      } else {
        setError(res.error);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-background-secondary p-6 md:p-8">
      <h2 className="font-heading text-2xl uppercase tracking-tight text-white mb-6">
        Redigera profil
      </h2>

      <div className="flex items-start gap-5 mb-6 pb-6 border-b border-border">
        <div className="relative h-16 w-16 shrink-0 rounded-full overflow-hidden border border-border bg-background-tertiary">
          {user.avatar_url ? (
            <Image
              src={user.avatar_url}
              alt=""
              fill
              sizes="64px"
              className="object-cover"
              unoptimized={user.avatar_url.startsWith("http")}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-foreground-subtle">
              ?
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="text-xs uppercase tracking-[0.2em] text-foreground-subtle mb-2">
            Profilbild
          </p>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading || pending}
            className="inline-flex items-center gap-2 rounded-full bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-white/90 disabled:opacity-60"
          >
            <Upload className="h-4 w-4" />
            {uploading ? "Laddar upp…" : "Ladda upp ny"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleAvatarFile(f);
              e.target.value = "";
            }}
          />
          <p className="text-xs text-foreground-subtle mt-2">
            JPG/PNG/WebP, max 5 MB.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid sm:grid-cols-2 gap-4">
        <Field label="Användarnamn" wide={false}>
          <input
            type="text"
            value={form.username}
            onChange={(e) => set("username", e.target.value.toLowerCase())}
            pattern="[a-z0-9_]{2,30}"
            required
            className={INPUT}
          />
        </Field>
        <Field label="Visningsnamn">
          <input
            type="text"
            value={form.display_name}
            onChange={(e) => set("display_name", e.target.value)}
            className={INPUT}
          />
        </Field>

        <Field label="Bio" wide>
          <textarea
            value={form.bio}
            onChange={(e) => set("bio", e.target.value)}
            rows={3}
            maxLength={500}
            className={`${INPUT} resize-none`}
          />
        </Field>

        <Field label="Region">
          <input
            type="text"
            value={form.region}
            onChange={(e) => set("region", e.target.value.toUpperCase())}
            placeholder="SE"
            maxLength={8}
            className={INPUT}
          />
        </Field>
        <Field label="Kontotyp">
          <select
            value={form.account_type}
            onChange={(e) =>
              set("account_type", e.target.value as "creator" | "brand")
            }
            className={INPUT}
          >
            <option value="creator">Kreatör</option>
            <option value="brand">Märke</option>
          </select>
        </Field>

        {form.account_type === "brand" && (
          <>
            <Field label="Märkesnamn">
              <input
                type="text"
                value={form.brand_name}
                onChange={(e) => set("brand_name", e.target.value)}
                className={INPUT}
              />
            </Field>
            <Field label="Märkets hemsida">
              <input
                type="url"
                value={form.brand_website}
                onChange={(e) => set("brand_website", e.target.value)}
                placeholder="https://example.com"
                className={INPUT}
              />
            </Field>
          </>
        )}

        <Field label="Instagram">
          <input
            type="text"
            value={form.instagram}
            onChange={(e) => set("instagram", e.target.value)}
            placeholder="användarnamn"
            className={INPUT}
          />
        </Field>
        <Field label="TikTok">
          <input
            type="text"
            value={form.tiktok}
            onChange={(e) => set("tiktok", e.target.value)}
            placeholder="användarnamn"
            className={INPUT}
          />
        </Field>
        <Field label="YouTube">
          <input
            type="text"
            value={form.youtube}
            onChange={(e) => set("youtube", e.target.value)}
            placeholder="kanal"
            className={INPUT}
          />
        </Field>
        <Field label="Hemsida">
          <input
            type="url"
            value={form.website}
            onChange={(e) => set("website", e.target.value)}
            placeholder="https://"
            className={INPUT}
          />
        </Field>

        {error && (
          <p className="text-xs text-red-400 sm:col-span-2">{error}</p>
        )}
        {success && (
          <p className="text-xs text-emerald-300 sm:col-span-2">{success}</p>
        )}

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-full bg-white text-black px-5 py-2.5 text-sm font-semibold hover:bg-white/90 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {pending ? "Sparar…" : "Spara ändringar"}
          </button>
        </div>
      </form>
    </section>
  );
}

const INPUT =
  "w-full rounded-xl bg-background-tertiary border border-border text-sm text-white placeholder:text-foreground-subtle p-3 outline-none focus:border-white/30";

function Field({
  label,
  children,
  wide = false,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={`block ${wide ? "sm:col-span-2" : ""}`}>
      <span className="block text-xs uppercase tracking-[0.2em] text-foreground-subtle mb-2">
        {label}
      </span>
      {children}
    </label>
  );
}
