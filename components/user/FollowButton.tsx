"use client";

import { useEffect, useState, useTransition } from "react";
import { PremiumButton } from "../shared/PremiumButton";
import { useAuth } from "@/lib/auth-context";
import { toggleFollow } from "@/app/actions/engagement";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function FollowButton({
  userId,
  initiallyFollowing = false,
}: {
  userId?: string;
  initiallyFollowing?: boolean;
}) {
  const { user, isLoggedIn, requireAuth } = useAuth();
  const [, startTransition] = useTransition();
  // Plain useState (not useOptimistic) so the toggle persists visually
  // after the server action's transition completes — useOptimistic would
  // revert to `initiallyFollowing` and make the click look like a no-op.
  const [following, setFollowing] = useState(initiallyFollowing);

  useEffect(() => {
    setFollowing(initiallyFollowing);
  }, [userId, initiallyFollowing]);

  const isOwnProfile = userId && user?.id === userId;
  const isPersisted = userId && UUID_RE.test(userId);

  if (isOwnProfile) return null;

  const handleClick = () => {
    if (!isLoggedIn) {
      requireAuth("follow");
      return;
    }
    const next = !following;
    setFollowing(next);
    if (!isPersisted) return;
    startTransition(async () => {
      const res = await toggleFollow(userId!);
      if (!res.ok) setFollowing(!next);
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
