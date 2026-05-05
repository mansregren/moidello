"use client";

import { useState } from "react";
import { PremiumButton } from "../shared/PremiumButton";
import { useAuth } from "@/lib/auth-context";

export function FollowButton() {
  const { requireAuth } = useAuth();
  const [following, setFollowing] = useState(false);

  const handleClick = () => {
    if (!requireAuth("follow")) return;
    setFollowing(!following);
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
