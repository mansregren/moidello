"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { UserAvatar } from "./UserAvatar";
import { FollowButton } from "./FollowButton";
import { useAuth } from "@/lib/auth-context";

type Mode = "followers" | "following";

interface Row {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export function FollowersList({
  profileId,
  mode,
}: {
  profileId: string;
  mode: Mode;
}) {
  const { user: viewer } = useAuth();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setRows(null);
    const supabase = createClient();
    let cancelled = false;

    (async () => {
      // Followers tab: people who follow profileId → join via follower_id.
      // Following tab: people profileId follows → join via followee_id.
      const joinAlias = mode === "followers" ? "follower" : "followee";
      const joinCol = mode === "followers" ? "follower_id" : "followee_id";
      const filterCol = mode === "followers" ? "followee_id" : "follower_id";

      const { data, error } = await supabase
        .from("follows")
        .select(
          `${joinAlias}:profiles!${joinCol}(id, username, display_name, avatar_url), created_at`,
        )
        .eq(filterCol, profileId)
        .order("created_at", { ascending: false });

      if (cancelled || error) {
        if (!cancelled) setRows([]);
        return;
      }

      const list = (
        (data as unknown as Array<{ [k: string]: Row | null }>) ?? []
      )
        .map((r) => r[joinAlias])
        .filter((r): r is Row => !!r);

      setRows(list);

      if (viewer && list.length > 0) {
        const { data: vf } = await supabase
          .from("follows")
          .select("followee_id")
          .eq("follower_id", viewer.id)
          .in(
            "followee_id",
            list.map((r) => r.id),
          );
        if (!cancelled && vf) {
          setFollowingIds(
            new Set((vf as Array<{ followee_id: string }>).map((r) => r.followee_id)),
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [profileId, mode, viewer?.id]);

  if (rows === null) {
    return (
      <div className="max-w-md mx-auto space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 rounded-xl bg-background-tertiary animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="py-12 text-center text-foreground-muted text-sm">
        {mode === "followers" ? "Inga följare än." : "Följer ingen än."}
      </p>
    );
  }

  return (
    <ul className="max-w-md mx-auto space-y-1">
      {rows.map((r) => (
        <li
          key={r.id}
          className="flex items-center gap-3 p-3 rounded-2xl hover:bg-foreground/[0.04] transition-colors"
        >
          <Link
            href={`/profile/${r.username}`}
            className="flex items-center gap-3 flex-1 min-w-0"
          >
            <UserAvatar
              src={r.avatar_url ?? ""}
              alt={r.display_name ?? r.username}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {r.display_name ?? r.username}
              </p>
              <p className="text-xs text-foreground-subtle truncate">
                @{r.username}
              </p>
            </div>
          </Link>
          {viewer?.id !== r.id && (
            <FollowButton
              userId={r.id}
              initiallyFollowing={followingIds.has(r.id)}
            />
          )}
        </li>
      ))}
    </ul>
  );
}
