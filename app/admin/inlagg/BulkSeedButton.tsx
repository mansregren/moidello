"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { BulkSeedModal } from "./BulkSeedModal";

interface SeedUser {
  id: string;
  username: string;
  display_name: string | null;
}

export function BulkSeedButton({ users }: { users: SeedUser[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-white/90"
      >
        <Sparkles className="h-4 w-4" />
        Skapa från bilder
      </button>
      <BulkSeedModal
        users={users}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
