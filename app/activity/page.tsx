"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Activity, UserPlus, MessageSquare, Reply, Edit, Award, Target, TrendingUp, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getAvatarUrl } from "@/lib/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ContributorAvatar } from "@/components/contributor-avatar";
import type { Activity as ActivityType, User } from "@/shared/schema";

type ActivityWithUser = ActivityType & { user: User };

const BIG_TYPES = new Set(["tier_up"]);
const NOTABLE_TYPES = new Set(["quest_completed", "referral_milestone", "event_organized"]);
const AMBIENT_TYPES = new Set(["new_contributor", "new_topic", "new_reply", "profile_update"]);

const activityIcons: Record<string, typeof UserPlus> = {
  new_contributor: UserPlus,
  new_topic: MessageSquare,
  new_reply: Reply,
  profile_update: Edit,
  tier_up: Award,
  quest_completed: Target,
  referral_milestone: TrendingUp,
  event_organized: Trophy,
};

const ambientLabels: Record<string, { singular: string; plural: string }> = {
  new_contributor: { singular: "contributor joined", plural: "contributors joined" },
  new_topic: { singular: "new discussion started", plural: "new discussions started" },
  new_reply: { singular: "reply posted", plural: "replies posted" },
  profile_update: { singular: "profile updated", plural: "profiles updated" },
};

const notableLabels: Record<string, string> = {
  quest_completed: "completed a quest",
  referral_milestone: "hit a referral milestone",
  event_organized: "organized an event",
};

function getTimeBucket(date: Date | string): "today" | "this_week" | "earlier" {
  const now = new Date();
  const d = new Date(date);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  if (d >= startOfToday) return "today";
  if (d >= startOfWeek) return "this_week";
  return "earlier";
}

function formatTimeAgo(date: Date | string) {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}

function getTierTypography(tier: string) {
  if (tier === "fellow") return "font-display font-semibold";
  if (tier === "ambassador") return "font-display font-medium";
  return "font-sans";
}

function getAvatarRingClass(tier: string) {
  if (tier === "fellow") return "ring-2 ring-foreground";
  return "";
}

function UserName({ user }: { user: User }) {
  const cls = getTierTypography(user.tier);
  return (
    <Link href={`/contributors/${user.id}`}>
      <span className={`${cls} cursor-pointer`}>{user.username ?? "Unknown"}</span>
    </Link>
  );
}

type FeedItem =
  | { kind: "big"; activity: ActivityWithUser }
  | { kind: "notable"; activity: ActivityWithUser }
  | { kind: "ambient_group"; type: string; activities: ActivityWithUser[] };

type TimeSection = {
  label: string;
  items: FeedItem[];
};

function buildSections(activities: ActivityWithUser[]): TimeSection[] {
  const bucketOrder: Array<"today" | "this_week" | "earlier"> = ["today", "this_week", "earlier"];
  const bucketLabels: Record<string, string> = { today: "Today", this_week: "This Week", earlier: "Earlier" };

  const buckets: Record<string, ActivityWithUser[]> = { today: [], this_week: [], earlier: [] };
  for (const a of activities) {
    buckets[getTimeBucket(a.createdAt)].push(a);
  }

  const sections: TimeSection[] = [];

  for (const bucket of bucketOrder) {
    const list = buckets[bucket];
    if (list.length === 0) continue;

    const items: FeedItem[] = [];
    let i = 0;
    while (i < list.length) {
      const a = list[i];
      if (BIG_TYPES.has(a.type)) {
        items.push({ kind: "big", activity: a });
        i++;
      } else if (NOTABLE_TYPES.has(a.type)) {
        items.push({ kind: "notable", activity: a });
        i++;
      } else if (AMBIENT_TYPES.has(a.type)) {
        const group: ActivityWithUser[] = [a];
        let j = i + 1;
        while (j < list.length && list[j].type === a.type && AMBIENT_TYPES.has(list[j].type)) {
          group.push(list[j]);
          j++;
        }
        items.push({ kind: "ambient_group", type: a.type, activities: group });
        i = j;
      } else {
        items.push({ kind: "notable", activity: a });
        i++;
      }
    }

    sections.push({ label: bucketLabels[bucket], items });
  }

  return sections;
}

function BigMoment({ activity }: { activity: ActivityWithUser }) {
  const meta = activity.metadata as Record<string, string> | null;

  return (
    <div className="py-12" data-testid={`activity-item-${activity.id}`}>
      <Card className="rounded-[10px]">
        <CardContent className="p-8">
          <div className="flex items-center gap-6">
            <Link href={`/contributors/${activity.userId}`}>
              <ContributorAvatar user={activity.user} size="lg" isActive />
            </Link>
            <div className="flex-1 min-w-0">
              <h2 className="font-display font-semibold text-2xl" data-testid={`activity-heading-${activity.id}`}>
                <UserName user={activity.user} />
              </h2>
              <p className="font-sans text-base text-muted-foreground mt-2">
                was promoted to{" "}
                <span className="font-display font-semibold text-foreground capitalize">
                  {meta?.newTier ?? "a new tier"}
                </span>
              </p>
              <span className="font-mono text-xs text-muted-foreground mt-2 inline-block" data-testid={`activity-meta-${activity.id}`}>
                {formatTimeAgo(activity.createdAt)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function NotableMoment({ activity }: { activity: ActivityWithUser }) {
  const Icon = activityIcons[activity.type] || Activity;
  const label = notableLabels[activity.type] || "performed an action";
  const meta = activity.metadata as Record<string, string> | null;

  const detail = meta?.questTitle || meta?.eventName || meta?.topicTitle || null;

  return (
    <div className="py-4" data-testid={`activity-item-${activity.id}`}>
      <Card className="rounded-[10px]">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Link href={`/contributors/${activity.userId}`}>
              <ContributorAvatar user={activity.user} size="md" />
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <p className="font-sans text-base">
                  <UserName user={activity.user} />{" "}
                  <span className="text-muted-foreground">{label}</span>
                </p>
              </div>
              {detail && (
                <p className="font-sans text-sm text-muted-foreground mt-1 truncate" data-testid={`activity-meta-${activity.id}`}>
                  {detail}
                </p>
              )}
              <span className="font-mono text-xs text-muted-foreground mt-2 inline-block">
                {formatTimeAgo(activity.createdAt)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AmbientGroup({ type, activities }: { type: string; activities: ActivityWithUser[] }) {
  const Icon = activityIcons[type] || Activity;
  const labels = ambientLabels[type] || { singular: "action", plural: "actions" };
  const count = activities.length;
  const label = count === 1 ? labels.singular : labels.plural;
  const visibleAvatars = activities.slice(0, 5);

  const firstId = activities[0]?.id;

  return (
    <div className="py-1 flex items-center gap-3" data-testid={`activity-group-${type}-${firstId}`}>
      <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      <div className="flex items-center">
        {visibleAvatars.map((a, i) => {
          const ringClass = getAvatarRingClass(a.user?.tier ?? "contributor");
          return (
            <div
              key={a.id}
              className={`w-5 h-5 rounded-full overflow-hidden ${ringClass} ${i > 0 ? "-ml-2" : ""}`}
              data-testid={`activity-item-${a.id}`}
            >
              <img src={getAvatarUrl(a.user?.username || "Anonymous")} alt={a.user?.username || "Anonymous"} className="w-full h-full object-cover" />
            </div>
          );
        })}
      </div>
      <span className="font-sans text-xs uppercase tracking-[0.05em] text-muted-foreground">
        <span className="font-mono">{count}</span> {label}
      </span>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="rounded-[10px]">
        <CardContent className="p-8">
          <div className="flex items-center gap-6">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        </CardContent>
      </Card>
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="rounded-[10px]">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      <div className="flex items-center gap-3 py-1">
        <Skeleton className="w-3.5 h-3.5 rounded" />
        <div className="flex">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className={`w-5 h-5 rounded-full ${i > 0 ? "-ml-2" : ""}`} />
          ))}
        </div>
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

export default function ActivityFeed() {
  const { data: activities, isLoading } = useQuery<ActivityWithUser[]>({
    queryKey: ["/api/activities"],
  });

  const sections = activities ? buildSections(activities) : [];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6 sm:p-8">
        <h1 className="font-display font-semibold text-2xl mb-10 page-title-fade" data-testid="text-activity-title">
          Activity
        </h1>

        {isLoading ? (
          <LoadingSkeleton />
        ) : activities?.length === 0 ? (
          <div className="text-center py-20" data-testid="text-empty-activity">
            <Activity className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-display font-semibold mb-1">No activity yet</h3>
            <p className="font-sans text-sm text-muted-foreground">
              Contributor activity will show up here.
            </p>
          </div>
        ) : (
          <div>
            {sections.map((section) => (
              <div key={section.label} className="mb-10">
                <h2
                  className="font-sans text-xs uppercase tracking-[0.05em] text-muted-foreground font-medium mb-4"
                  data-testid={`section-header-${section.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {section.label}
                </h2>
                <div>
                  {section.items.map((item, idx) => {
                    if (item.kind === "big") {
                      return <BigMoment key={item.activity.id} activity={item.activity} />;
                    }
                    if (item.kind === "notable") {
                      return <NotableMoment key={item.activity.id} activity={item.activity} />;
                    }
                    if (item.kind === "ambient_group") {
                      return (
                        <AmbientGroup
                          key={`${item.type}-${idx}`}
                          type={item.type}
                          activities={item.activities}
                        />
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
