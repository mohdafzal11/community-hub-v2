"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getAvatarUrl } from "@/lib/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ContributorAvatar } from "@/components/contributor-avatar";
import { ContributionTimeline, generateMockWeeklyData } from "@/components/contribution-timeline";
import { ContributorTooltip } from "@/components/contributor-tooltip";
import type { User } from "@/shared/schema";

const tierLabels: Record<string, string> = {
  contributor: "Contributor",
  ambassador: "Ambassador",
  fellow: "Fellow",
};

const sortOptions = [
  { key: "totalPoints", label: "Points" },
  { key: "referrals", label: "Referrals" },
  { key: "content", label: "Content" },
  { key: "events", label: "Events" },
];

function getRankChange(): { direction: "up" | "down" | "same"; amount: number } {
  const r = Math.random();
  if (r < 0.3) return { direction: "up", amount: Math.floor(Math.random() * 2) + 1 };
  if (r < 0.5) return { direction: "down", amount: Math.floor(Math.random() * 2) + 1 };
  return { direction: "same", amount: 0 };
}

export default function Leaderboard() {
  const [sortBy, setSortBy] = useState("totalPoints");

  const { data: contributors, isLoading } = useQuery<User[]>({
    queryKey: [`/api/leaderboard?sortBy=${sortBy}`],
  });

  const getSortValue = (user: User) => {
    switch (sortBy) {
      case "referrals": return user.referralsCount ?? 0;
      case "content": return user.contentCount ?? 0;
      case "events": return user.eventsCount ?? 0;
      default: return user.totalPoints ?? 0;
    }
  };

  const first = contributors?.[0];
  const second = contributors?.[1];
  const third = contributors?.[2];
  const rest = contributors?.slice(3) ?? [];

  const getBadgeClass = (tier: string) => {
    const base = "text-xs font-sans uppercase tracking-[0.05em]";
    if (tier === "fellow") return `${base} font-medium text-foreground`;
    return `${base} text-muted-foreground`;
  };

  const getNameClass = (tier: string) => {
    if (tier === "fellow") return "font-display font-semibold text-sm";
    if (tier === "ambassador") return "font-display font-medium text-sm";
    return "font-sans text-sm";
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-8 sm:py-10">
        <h1 className="font-display font-semibold text-2xl mb-6 page-title-fade" data-testid="text-leaderboard-title">
          Leaderboard
        </h1>

        <div className="flex items-center gap-2 mb-8 flex-wrap sticky top-0 z-10 bg-background py-2 -mt-2">
          {sortOptions.map((opt) => (
            <Button
              key={opt.key}
              variant={sortBy === opt.key ? "outline" : "ghost"}
              size="sm"
              className={`rounded-[6px] ${sortBy === opt.key ? "border-primary" : ""}`}
              onClick={() => setSortBy(opt.key)}
              data-testid={`sort-${opt.key}`}
            >
              {opt.label}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-[10px]" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-32 rounded-[10px]" />
              <Skeleton className="h-32 rounded-[10px]" />
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-[10px]" />
            ))}
          </div>
        ) : (
          <>
            {first && (
              <div className="space-y-4">
                <div
                  className="bg-[#111110] text-[#FAFAF8] rounded-[10px] py-8 px-6 hover-elevate"
                  data-testid={`leaderboard-row-${first.id}`}
                >
                  <div className="flex items-center gap-5">
                    <span className="font-mono text-[#FAFAF8]/50 text-sm shrink-0">#1</span>
                    <Link href={`/contributors/${first.id}`}>
                      <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 cursor-pointer">
                        <img src={getAvatarUrl(first.username)} alt={first.username} className="w-full h-full object-cover" />
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/contributors/${first.id}`}>
                        <span
                          className="font-display font-semibold text-xl cursor-pointer block truncate"
                          data-testid={`text-lb-name-${first.id}`}
                        >
                          {first.username}
                        </span>
                      </Link>
                      <span className="text-xs font-sans uppercase tracking-[0.05em] text-[#FAFAF8]/50">
                        {tierLabels[first.tier] || first.tier}
                      </span>
                    </div>
                    <span
                      className="font-mono font-bold text-3xl shrink-0"
                      data-testid={`text-lb-value-${first.id}`}
                    >
                      {getSortValue(first).toLocaleString()}
                    </span>
                  </div>
                </div>

                {(second || third) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[second, third].map((contributor, i) => {
                      if (!contributor) return null;
                      const rank = i + 2;
                      return (
                        <div
                          key={contributor.id}
                          className="bg-card rounded-[10px] py-5 px-5 hover-elevate"
                          data-testid={`leaderboard-row-${contributor.id}`}
                        >
                          <div className="flex items-center gap-4">
                            <span className="font-mono text-muted-foreground text-sm shrink-0">#{rank}</span>
                            <Link href={`/contributors/${contributor.id}`}>
                              <ContributorAvatar user={contributor} size="md" isTopThree />
                            </Link>
                            <div className="flex-1 min-w-0">
                              <ContributorTooltip user={contributor} rank={rank}>
                                <Link href={`/contributors/${contributor.id}`}>
                                  <span
                                    className="font-display font-medium text-base cursor-pointer block truncate hover:text-primary transition-colors"
                                    data-testid={`text-lb-name-${contributor.id}`}
                                  >
                                    {contributor.username}
                                  </span>
                                </Link>
                              </ContributorTooltip>
                              <span className={getBadgeClass(contributor.tier)}>
                                {tierLabels[contributor.tier] || contributor.tier}
                              </span>
                            </div>
                            <span
                              className="font-mono font-bold text-2xl shrink-0"
                              data-testid={`text-lb-value-${contributor.id}`}
                            >
                              {getSortValue(contributor).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {rest.length > 0 && (
              <div className="mt-12 space-y-0">
                {rest.map((contributor, index) => {
                  const rank = index + 4;
                  const value = getSortValue(contributor);
                  const change = getRankChange();
                  const thirdValue = third ? getSortValue(third) : 0;
                  const pointsGap = rank === 4 && thirdValue - value <= 100 && thirdValue - value > 0
                    ? thirdValue - value
                    : null;
                  const weeklyData = generateMockWeeklyData(contributor.totalPoints, contributor.eventsCount);

                  return (
                    <div
                      key={contributor.id}
                      className="flex items-center gap-4 py-4 border-b border-border last:border-b-0"
                      data-testid={`leaderboard-row-${contributor.id}`}
                    >
                      <span className="font-mono text-muted-foreground text-sm w-8 shrink-0 flex items-center gap-1">
                        {rank}
                        {change.direction === "up" && (
                          <span className="text-[10px] text-foreground font-bold leading-none" title={`Up ${change.amount}`}>&#9650;</span>
                        )}
                        {change.direction === "down" && (
                          <span className="text-[10px] text-muted-foreground leading-none" title={`Down ${change.amount}`}>&#9660;</span>
                        )}
                      </span>
                      <Link href={`/contributors/${contributor.id}`}>
                        <ContributorAvatar user={contributor} size="md" isActive={Math.random() > 0.5} />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <ContributorTooltip user={contributor} rank={rank}>
                          <Link href={`/contributors/${contributor.id}`}>
                            <span
                              className={`${getNameClass(contributor.tier)} cursor-pointer truncate block hover:text-primary transition-colors`}
                              data-testid={`text-lb-name-${contributor.id}`}
                            >
                              {contributor.username}
                            </span>
                          </Link>
                        </ContributorTooltip>
                        <div className="mt-1 hidden sm:block">
                          <ContributionTimeline weeks={weeklyData} variant="mini" />
                        </div>
                      </div>
                      <span className={`${getBadgeClass(contributor.tier)} shrink-0`}>
                        {tierLabels[contributor.tier] || contributor.tier}
                      </span>
                      <div className="text-right shrink-0 min-w-[70px]">
                        <span
                          className="font-mono text-xl text-foreground tabular-nums block"
                          data-testid={`text-lb-value-${contributor.id}`}
                        >
                          {value.toLocaleString()}
                        </span>
                        {pointsGap !== null && (
                          <span className="text-xs text-muted-foreground">{pointsGap} pts behind</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
