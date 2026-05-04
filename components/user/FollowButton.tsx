"use client";

import { useState } from "react";
import { PremiumButton } from "../shared/PremiumButton";

export function FollowButton() {
  const [following, setFollowing] = useState(false);

  return (
    <PremiumButton
      variant={following ? "secondary" : "primary"}
      size="sm"
      onClick={() => setFollowing(!following)}
    >
      {following ? "Följer" : "Följ"}
    </PremiumButton>
  );
}
