import Link from "next/link";
import { User } from "@/lib/types";
import { UserAvatar } from "./UserAvatar";

interface UserCardProps {
  user: User;
}

export function UserCard({ user }: UserCardProps) {
  return (
    <Link
      href={`/profile/${user.username}`}
      className="flex flex-col items-center gap-3 group"
    >
      <div className="transition-transform duration-300 group-hover:scale-105">
        <UserAvatar src={user.avatar} alt={user.displayName} size="lg" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">{user.displayName}</p>
        <p className="text-xs text-foreground-subtle">
          @{user.username}
        </p>
      </div>
    </Link>
  );
}
