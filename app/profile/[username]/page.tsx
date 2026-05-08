import { notFound } from "next/navigation";
import {
  fetchProfileByUsername,
  fetchOutfitsByUser,
  fetchEngagementForViewer,
  isFollowing,
} from "@/lib/queries";
import { users as mockUsers, outfits as mockOutfits } from "@/lib/data";
import ProfileDetail from "./ProfileDetail";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const dbProfile = await fetchProfileByUsername(username);
  const mockMatch = mockUsers.find((u) => u.username === username);

  if (!dbProfile && !mockMatch) {
    notFound();
  }

  const profile = dbProfile ?? mockMatch!;

  const userOutfits = dbProfile
    ? await fetchOutfitsByUser(profile.id)
    : mockOutfits.filter((o) => o.creator.id === profile.id);

  const [{ liked, saved }, alreadyFollowing] = dbProfile
    ? await Promise.all([
        fetchEngagementForViewer(userOutfits.map((o) => o.id)),
        isFollowing(profile.id),
      ])
    : [{ liked: new Set<string>(), saved: new Set<string>() }, false];

  return (
    <ProfileDetail
      user={profile}
      outfits={userOutfits}
      likedIds={Array.from(liked)}
      savedIds={Array.from(saved)}
      initiallyFollowing={alreadyFollowing}
    />
  );
}
