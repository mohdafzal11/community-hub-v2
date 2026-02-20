"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Search, Users, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { ContributorAvatar } from "@/components/contributor-avatar";
import { ContributionTimeline, generateMockWeeklyData } from "@/components/contribution-timeline";
import { ContributorTooltip } from "@/components/contributor-tooltip";
import type { User } from "@/shared/schema";

const tierLabels: Record<string, string> = {
  contributor: "Contributor",
  ambassador: "Ambassador",
  fellow: "Fellow",
};

const tierFilters = [
  { value: "all", label: "All" },
  { value: "contributor", label: "Contributor" },
  { value: "ambassador", label: "Ambassador" },
  { value: "fellow", label: "Fellow" },
];

function getNameClasses(tier: string): string {
  switch (tier) {
    case "fellow":
      return "font-display font-semibold text-sm";
    case "ambassador":
      return "font-display font-medium text-sm";
    default:
      return "font-sans text-sm";
  }
}

function ContributorRow({ member }: { member: User }) {
  const weeklyData = generateMockWeeklyData(member.totalPoints, member.eventsCount);

  return (
    <Link href={`/contributors/${member.id}`}>
      <div className="flex items-center gap-4 py-3.5 px-4 hover-elevate cursor-pointer" data-testid={`card-contributor-${member.id}`}>
        <ContributorAvatar
          user={member}
          size="md"
          isActive={Math.random() > 0.4}
          hasStreak={member.eventsCount >= 4}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <ContributorTooltip user={member}>
              <p className={`${getNameClasses(member.tier)} hover:text-primary transition-colors`} data-testid={`text-contributor-name-${member.id}`}>
                {member.username}
              </p>
            </ContributorTooltip>
            <span className="text-xs uppercase tracking-[0.05em] text-muted-foreground">
              {tierLabels[member.tier] || member.tier}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            {member.city && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {member.city}
              </span>
            )}
            <div className="hidden sm:block">
              <ContributionTimeline weeks={weeklyData} variant="mini" />
            </div>
          </div>
        </div>
        <span className="font-mono text-sm shrink-0" data-testid={`text-contributor-points-${member.id}`}>
          {(member.totalPoints ?? 0).toLocaleString()} pts
        </span>
      </div>
    </Link>
  );
}

function ContributorSkeleton() {
  return (
    <div className="flex items-center gap-4 py-3.5 px-4">
      <Skeleton className="w-9 h-9 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-4 w-16" />
    </div>
  );
}

export default function Contributors() {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");

  const { data: members, isLoading } = useQuery<User[]>({
    queryKey: ["/api/members"],
  });

  const filtered = members?.filter((m) => {
    const matchesSearch =
      !search ||
      m.username.toLowerCase().includes(search.toLowerCase()) ||
      m.bio?.toLowerCase().includes(search.toLowerCase()) ||
      m.city?.toLowerCase().includes(search.toLowerCase()) ||
      m.college?.toLowerCase().includes(search.toLowerCase()) ||
      m.skillTags?.some((t) => t.toLowerCase().includes(search.toLowerCase()));

    const matchesTier =
      tierFilter === "all" || m.tier === tierFilter;

    return matchesSearch && matchesTier;
  });

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto p-5 sm:p-8">
        <h1 className="font-display font-semibold text-2xl mb-6 page-title-fade" data-testid="text-page-title">
          Contributors
        </h1>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search contributors..."
            className="pl-9 h-12"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-contributor-search"
          />
        </div>

        <div className="flex items-center gap-2 mb-6 flex-wrap sticky top-0 z-10 bg-background py-2 -mt-2">
          {tierFilters.map((tf) => (
            <Button
              key={tf.value}
              variant="outline"
              size="sm"
              className={`toggle-elevate ${tierFilter === tf.value ? "toggle-elevated border-primary" : ""}`}
              onClick={() => setTierFilter(tf.value)}
              data-testid={`button-filter-${tf.value}`}
            >
              {tf.label}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <Card>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>
                {i > 0 && <div className="border-t" />}
                <ContributorSkeleton />
              </div>
            ))}
          </Card>
        ) : filtered?.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold mb-1">No contributors found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <Card>
            {filtered?.map((member, i) => (
              <div key={member.id}>
                {i > 0 && <div className="border-t" />}
                <ContributorRow member={member} />
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
