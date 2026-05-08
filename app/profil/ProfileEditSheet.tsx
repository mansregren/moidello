"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera } from "lucide-react";
import Image from "next/image";
import { UserAvatar } from "@/components/user/UserAvatar";
import { resizeImageForUpload } from "@/lib/image-resize";
import {
  updateProfile,
  type ProfileUpdateState,
} from "./actions";
import type { User as MoidelloUser } from "@/lib/types";

const initialState: ProfileUpdateState = {};

const REGIONS = [
  { code: "SE", label: "Sverige" },
  { code: "NO", label: "Norge" },
  { code: "DK", label: "Danmark" },
  { code: "FI", label: "Finland" },
  { code: "IS", label: "Island" },
  { code: "EU", label: "EU (övriga)" },
  { code: "US", label: "USA" },
  { code: "GB", label: "Storbritannien" },
];

export function ProfileEditSheet({
  open,
  onClose,
  profile,
}: {
  open: boolean;
  onClose: () => void;
  profile: MoidelloUser;
}) {
  const [username, setUsername] = useState(profile.username);
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio);
  const [region, setRegion] = useState(profile.region ?? "SE");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [state, formAction, pending] = useActionState(
    updateProfile,
    initialState,
  );

  useEffect(() => {
    if (state.ok) {
      onClose();
    }
  }, [state.ok, onClose]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(null);
      return;
    }
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  const handleAvatarChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const resized = await resizeImageForUpload(file, { maxDim: 512 });
      setAvatarFile(resized);
      if (fileInputRef.current && resized !== file) {
        const dt = new DataTransfer();
        dt.items.add(resized);
        fileInputRef.current.files = dt.files;
      }
    } catch {
      setAvatarFile(file);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-background-secondary border border-white/10 p-6 relative"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-heading text-2xl uppercase tracking-tight text-white">
                Redigera profil
              </h2>
              <button
                onClick={onClose}
                aria-label="Stäng"
                className="flex h-9 w-9 items-center justify-center rounded-full text-foreground-muted hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form action={formAction} className="space-y-5">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  {avatarPreview ? (
                    <div className="h-20 w-20 overflow-hidden rounded-full bg-background-tertiary">
                      <Image
                        src={avatarPreview}
                        alt="Förhandsvisning"
                        width={80}
                        height={80}
                        className="h-20 w-20 object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <UserAvatar
                      src={profile.avatar}
                      alt={profile.displayName}
                      size="lg"
                    />
                  )}
                  <label
                    htmlFor="avatar-input"
                    className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white text-black cursor-pointer hover:bg-white/90"
                    aria-label="Byt avatar"
                  >
                    <Camera className="h-4 w-4" />
                  </label>
                  <input
                    ref={fileInputRef}
                    id="avatar-input"
                    name="avatar"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleAvatarChange}
                    className="sr-only"
                  />
                </div>
                <div className="text-sm text-foreground-muted">
                  Klicka på kameran för att byta avatar.
                  <p className="text-xs text-foreground-subtle mt-1">
                    JPG, PNG, WebP — max 5 MB
                  </p>
                </div>
              </div>

              <Field label="Användarnamn" error={state.fieldErrors?.username}>
                <div className="flex items-center rounded-xl bg-background-tertiary border border-border focus-within:border-white/30 transition-colors overflow-hidden">
                  <span className="px-4 text-foreground-subtle">@</span>
                  <input
                    name="username"
                    type="text"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    maxLength={24}
                    value={username}
                    onChange={(e) =>
                      setUsername(
                        e.target.value.toLowerCase().replace(/\s+/g, ""),
                      )
                    }
                    className="flex-1 bg-transparent border-0 px-0 py-3 text-white placeholder:text-foreground-subtle outline-none"
                  />
                </div>
              </Field>

              <Field label="Visningsnamn">
                <input
                  name="display_name"
                  type="text"
                  maxLength={50}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="T.ex. Anna Svensson"
                  className="w-full rounded-xl bg-background-tertiary border border-border px-4 py-3 text-white placeholder:text-foreground-subtle outline-none focus:border-white/30 transition-colors"
                />
              </Field>

              <Field label="Bio" error={state.fieldErrors?.bio}>
                <textarea
                  name="bio"
                  maxLength={500}
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Berätta lite om dig själv…"
                  className="w-full rounded-xl bg-background-tertiary border border-border px-4 py-3 text-white placeholder:text-foreground-subtle outline-none focus:border-white/30 transition-colors resize-none"
                />
                <p className="mt-1 text-xs text-foreground-subtle">
                  {bio.length} / 500
                </p>
              </Field>

              <Field label="Region (var du shoppar)">
                <select
                  name="region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full rounded-xl bg-background-tertiary border border-border px-4 py-3 text-white outline-none focus:border-white/30 transition-colors"
                >
                  {REGIONS.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </Field>

              {state.error && (
                <p className="text-sm text-red-400">{state.error}</p>
              )}

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-full border border-border text-white py-3 text-sm font-medium hover:border-white/30 transition-colors"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 rounded-full bg-white text-black py-3 text-sm font-semibold transition-transform active:scale-[0.98] disabled:opacity-60"
                >
                  {pending ? "Sparar…" : "Spara ändringar"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground-muted block mb-2">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
