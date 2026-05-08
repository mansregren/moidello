"use client";

import { useOptimistic, useTransition } from "react";
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
  const [following, setFollowing] = useOptimistic(
    initiallyFollowing,
    (_state, next: boolean) => next,
  );

  const isOwnProfile = userId && user?.id === userId;
  const isPersisted = userId && UUID_RE.test(userId);

  if (isOwnProfile) return null;

  const handleClick = () => {
    if (!isLoggedIn) {
      requireAuth("follow");
      return;
    }
    if (!isPersisted) {
      startTransition(() => setFollowing(!following));
      return;
    }
    startTransition(async () => {
      setFollowing(!following);
      const res = await toggleFollow(userId!);
      if (!res.ok) setFollowing(following);
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
