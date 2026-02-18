"use client";

import { useState, useRef } from "react";
import { ContributorAvatar } from "@/components/contributor-avatar";
import { ContributionTimeline, generateMockWeeklyData } from "@/components/contribution-timeline";
import type { User } from "@/shared/schema";

interface ContributorTooltipProps {
  user: User;
  rank?: number;
  children: React.ReactNode;
}

export function ContributorTooltip({ user, rank, children }: ContributorTooltipProps) {
  const [show, setShow] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const handleEnter = () => {
    timeoutRef.current = setTimeout(() => setShow(true), 300);
  };

  const handleLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShow(false);
  };

  const tierLabel = user.tier === "regional_lead" ? "Regional Lead"
    : user.tier.charAt(0).toUpperCase() + user.tier.slice(1);

  const weeklyData = generateMockWeeklyData(user.totalPoints, user.eventsCount);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {children}
      {show && (
        <div
          ref={tooltipRef}
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 bg-card rounded-[10px] p-3 min-w-[220px] pointer-events-none"
          style={{
            boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
            animation: "page-title-fade 200ms var(--ease-slow) both",
          }}
          data-testid="tooltip-contributor"
        >
          <div className="flex items-center gap-2 mb-2">
            <ContributorAvatar user={user} size="sm" />
            <span className="font-display font-semibold text-sm">{user.username}</span>
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            {tierLabel}{rank ? ` · Rank #${rank}` : ""}
          </p>
          <ContributionTimeline weeks={weeklyData} variant="mini" />
          <div className="flex items-center gap-3 mt-2">
            <span className="font-mono text-xs text-muted-foreground">{user.referralsCount} referrals</span>
            <span className="font-mono text-xs text-muted-foreground">{user.totalPoints.toLocaleString()} pts</span>
          </div>
        </div>
      )}
    </div>
  );
}
