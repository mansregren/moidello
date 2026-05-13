"use client";

import { useState } from "react";
import { PenLine } from "lucide-react";
import { BulkManualModal } from "./BulkManualModal";

interface SeedUser {
  id: string;
  username: string;
  display_name: string | null;
}

export function BulkManualButton({ users }: { users: SeedUser[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-border text-foreground-muted hover:text-white hover:border-white/30 px-4 py-2 text-sm font-semibold"
      >
        <PenLine className="h-4 w-4" />
        Skapa manuellt
      </button>
      <BulkManualModal
        users={users}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
