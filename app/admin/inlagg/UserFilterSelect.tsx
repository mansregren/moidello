"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface SeedUser {
  id: string;
  username: string;
  display_name: string | null;
}

export function UserFilterSelect({
  users,
  current,
}: {
  users: SeedUser[];
  current: string | null;
}) {
  const router = useRouter();
  const sp = useSearchParams();

  const onChange = (value: string) => {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set("user_id", value);
    else params.delete("user_id");
    router.push(`/admin/inlagg?${params.toString()}`);
  };

  return (
    <select
      value={current ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-full border border-border bg-background-secondary text-foreground-muted hover:text-foreground hover:border-foreground/30 text-xs px-3 py-1.5 outline-none cursor-pointer"
    >
      <option value="">Alla användare</option>
      {users.map((u) => (
        <option key={u.id} value={u.id}>
          {u.display_name ?? u.username}
        </option>
      ))}
    </select>
  );
}
