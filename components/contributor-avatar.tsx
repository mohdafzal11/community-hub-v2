"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

const textSizeMap = {
  xs: "text-[6px]",
  sm: "text-[8px]",
  md: "text-xs",
  lg: "text-sm",
  xl: "text-xl",
};

export function ContributorAvatar({
  user,
  size = "md",
  isActive = false,
  hasStreak = false,
  isTopThree = false,
  className = "",
}: ContributorAvatarProps) {
  const initials = user.username?.slice(0, 2).toUpperCase() ?? "??";
  const avatarSize = isTopThree ? topThreeSizeMap[size] : sizeMap[size];
  const tierClass =
    user.tier === "legend"
      ? "ring-2 ring-foreground/20"
      : "";

  return (
    <div className={`relative inline-flex ${className}`}>
      <Avatar
        className={`${avatarSize} ${tierClass} ${hasStreak ? "streak-ring" : ""}`}
      >
        {user.avatarUrl && (
          <AvatarImage src={user.avatarUrl} alt={user.username} />
        )}
        <AvatarFallback className={textSizeMap[size]}>
          {initials}
        </AvatarFallback>
      </Avatar>
      {isActive && <span className="active-dot" />}
    </div>
  );
}
