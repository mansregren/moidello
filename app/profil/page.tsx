"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, X, Bell, Lock, HelpCircle, Info, LogOut } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";
import { OutfitGrid } from "@/components/outfit/OutfitGrid";
import { UserAvatar } from "@/components/user/UserAvatar";
import { outfits, users } from "@/lib/data";
import { useGender, matchesGenderFilter } from "@/lib/gender-context";
import { cn } from "@/lib/utils";

type ProfileTab = "outfits" | "saved" | "about";

const me = users[0]; // Phase 1: demo "current user"

export default function ProfilPage() {
  const { gender } = useGender();
  const [tab, setTab] = useState<ProfileTab>("outfits");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const myOutfits = outfits
    .filter((o) => o.creator.id === me.id && matchesGenderFilter(o.gender, gender))
    .slice(0, 9);

  const savedOutfits = outfits
    .filter((o) => o.creator.id !== me.id && matchesGenderFilter(o.gender, gender))
    .slice(0, 6);

  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="flex-1">
        {/* Cover */}
        <div className="relative h-44 md:h-64 overflow-hidden">
          {me.coverImage && (
            <Image
              src={me.coverImage}
              alt=""
              fill
              priority
              sizes="(min-width: 768px) 100vw, 100vw"
              className="object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-background" />
          <button
            onClick={() => setSettingsOpen(true)}
            aria-label="Inställningar"
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 backdrop-blur text-white hover:bg-black/80 transition-colors"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>

        <Container className="-mt-12 md:-mt-16 relative z-10">
          {/* Profile header */}
          <div className="flex items-end gap-5">
            <div className="ring-4 ring-background rounded-full">
              <UserAvatar src={me.avatar} alt={me.displayName} size="lg" />
            </div>
            <div className="flex-1 pb-3 min-w-0">
              <h1 className="font-heading text-3xl md:text-5xl uppercase tracking-tight text-white truncate">
                {me.displayName}
              </h1>
              <p className="text-sm text-foreground-muted truncate">
                @{me.username}
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm md:text-base text-foreground-muted max-w-2xl">
            {me.bio}
          </p>

          {/* Stats */}
          <div className="mt-6 flex gap-8 border-y border-border py-4">
            <Stat label="Outfits" value={me.outfitCount} />
            <Stat label="Följare" value={me.followers} />
            <Stat label="Följer" value={me.following} />
          </div>

          {/* Tabs */}
          <div className="mt-2 flex border-b border-border">
            <ProfileTabButton
              active={tab === "outfits"}
              onClick={() => setTab("outfits")}
            >
              Outfits
            </ProfileTabButton>
            <ProfileTabButton
              active={tab === "saved"}
              onClick={() => setTab("saved")}
            >
              Sparade
            </ProfileTabButton>
            <ProfileTabButton
              active={tab === "about"}
              onClick={() => setTab("about")}
            >
              Om
            </ProfileTabButton>
          </div>

          {/* Tab content */}
          <div className="mt-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                {tab === "outfits" &&
                  (myOutfits.length > 0 ? (
                    <OutfitGrid outfits={myOutfits} columns={3} />
                  ) : (
                    <Empty text="Inga outfits ännu" />
                  ))}

                {tab === "saved" &&
                  (savedOutfits.length > 0 ? (
                    <OutfitGrid outfits={savedOutfits} columns={3} />
                  ) : (
                    <Empty text="Du har inte sparat något än" />
                  ))}

                {tab === "about" && (
                  <div className="max-w-2xl space-y-5 text-sm">
                    <Field label="Namn" value={me.displayName} />
                    <Field label="Användarnamn" value={`@${me.username}`} />
                    <Field label="Bio" value={me.bio} />
                    <Field
                      label="Antal outfits"
                      value={me.outfitCount.toLocaleString("sv-SE")}
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="py-16" />
        </Container>

        {/* Settings modal */}
        <AnimatePresence>
          {settingsOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md"
              onClick={() => setSettingsOpen(false)}
            >
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
                className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-background-secondary border border-white/10 p-6 relative"
              >
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-heading text-2xl uppercase tracking-tight text-white">
                    Inställningar
                  </h2>
                  <button
                    onClick={() => setSettingsOpen(false)}
                    aria-label="Stäng"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-foreground-muted hover:bg-white/5 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <ul className="divide-y divide-border">
                  <SettingsRow icon={Bell} label="Notiser" />
                  <SettingsRow icon={Lock} label="Konto & sekretess" />
                  <SettingsRow icon={HelpCircle} label="Hjälp" />
                  <SettingsRow icon={Info} label="Om Moidello" />
                  <SettingsRow icon={LogOut} label="Logga ut" danger />
                </ul>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </>
  );
}

function ProfileTabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex-1 sm:flex-none px-4 py-3 text-sm font-medium transition-colors",
        active ? "text-white" : "text-foreground-subtle hover:text-foreground-muted"
      )}
    >
      {children}
      {active && (
        <motion.span
          layoutId="profile-tab-indicator"
          className="absolute inset-x-3 -bottom-px h-0.5 bg-white rounded-full"
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      )}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-lg font-semibold text-white">
        {value.toLocaleString("sv-SE")}
      </p>
      <p className="text-xs text-foreground-subtle uppercase tracking-wider">
        {label}
      </p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="py-24 text-center">
      <p className="text-foreground-muted">{text}</p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-foreground-subtle">
        {label}
      </p>
      <p className="mt-1 text-white">{value}</p>
    </div>
  );
}

function SettingsRow({
  icon: Icon,
  label,
  danger,
}: {
  icon: typeof Settings;
  label: string;
  danger?: boolean;
}) {
  return (
    <li>
      <button
        className={cn(
          "w-full flex items-center gap-3 py-4 text-left transition-colors",
          danger ? "text-red-400 hover:text-red-300" : "text-white hover:text-white/80"
        )}
      >
        <Icon className="h-5 w-5" />
        <span className="text-sm">{label}</span>
      </button>
    </li>
  );
}
