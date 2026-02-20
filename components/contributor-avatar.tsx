"use client";

import { getAvatarUrl } from "@/lib/avatar";
import type { User } from "@/shared/schema";

interface ContributorAvatarProps {
  user: Pick<User, "username" | "avatarUrl" | "tier">;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  isActive?: boolean;
  hasStreak?: boolean;
  isTopThree?: boolean;
  className?: string;
}

const sizeMap = {
  xs: "w-4 h-4",
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-10 h-10",
  xl: "w-20 h-20",
};

const topThreeSizeMap = {
  xs: "w-5 h-5",
  sm: "w-7 h-7",
  md: "w-10 h-10",
  lg: "w-12 h-12",
  xl: "w-24 h-24",
};

export function ContributorAvatar({
  user,
  size = "md",
  isActive = false,
  hasStreak = false,
  isTopThree = false,
  className = "",
}: ContributorAvatarProps) {
  const avatarSize = isTopThree ? topThreeSizeMap[size] : sizeMap[size];
  const tierClass =
    user.tier === "legend"
      ? "ring-2 ring-foreground/20"
      : "";

  return (
    <div className={`relative inline-flex ${className}`}>
      <div
        className={`${avatarSize} ${tierClass} ${hasStreak ? "streak-ring" : ""} rounded-full overflow-hidden shrink-0 relative after:content-[''] after:block after:absolute after:inset-0 after:rounded-full after:pointer-events-none after:border after:border-black/10 dark:after:border-white/10`}
      >
        <img
          src={getAvatarUrl(user.username || "Anonymous")}
          alt={user.username}
          className="w-full h-full object-cover"
        />
      </div>
      {isActive && <span className="active-dot" />}
    </div>
  );
}
