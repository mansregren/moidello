"use client";

import { useTransition } from "react";
import { PremiumButton } from "../shared/PremiumButton";
import { useAuth } from "@/lib/auth-context";
import { useViewerEngagement } from "@/lib/viewer-engagement-context";
import { toggleFollow } from "@/app/actions/engagement";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function FollowButton({
  userId,
}: {
  userId?: string;
  /** Deprecated — follow state now hydrates client-side via the viewer
   *  engagement context so profile pages can be ISR cached. Kept optional so
   *  existing call sites don't break. */
  initiallyFollowing?: boolean;
}) {
  const { user, isLoggedIn, requireAuth } = useAuth();
  const engagement = useViewerEngagement();
  const [, startTransition] = useTransition();

  const isOwnProfile = userId && user?.id === userId;
  const isPersisted = userId && UUID_RE.test(userId);
  const following = userId ? engagement.isFollowing(userId) : false;

  if (isOwnProfile) return null;

  const handleClick = () => {
    if (!isLoggedIn) {
      requireAuth("follow");
      return;
    }
    if (!userId) return;
    const next = !following;
    engagement.markFollowing(userId, next);
    if (!isPersisted) return;
    startTransition(async () => {
      const res = await toggleFollow(userId);
      if (!res.ok) engagement.markFollowing(userId, !next);
    });
  };

  return (
    <PremiumButton
      variant={following ? "secondary" : "primary"}
      size="sm"
      onClick={handleClick}
    >
      {following ? "Följer" : "Följ"}
    </PremiumButton>
  );
}
