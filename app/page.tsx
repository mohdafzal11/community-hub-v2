"use client";

import Link from "next/link";
import { useState } from "react";
import {
  MessageSquare,
  ArrowRight,
  UserPlus,
  Reply,
  Edit,
  Award,
  Target,
  TrendingUp,
  Trophy,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAvatarUrl } from "@/lib/avatar";
import { useAuth } from "@/lib/auth-context";
import { ContributorAvatar } from "@/components/contributor-avatar";
import { useQuery } from "@tanstack/react-query";
import type { User, Activity, ForumCategory, ForumTopic } from "@/shared/schema";

type TopicWithAuthor = ForumTopic & { author: User };

type ActivityWithUser = Activity & { user: User };

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

const activityVerbs: Record<string, string> = {
  new_contributor: "joined as a contributor",
  new_topic: "started a discussion",
  new_reply: "replied to a topic",
  profile_update: "updated their profile",
  tier_up: "leveled up",
  quest_completed: "completed a quest",
  referral_milestone: "hit a referral milestone",
  event_organized: "organized an event",
};

const BIG_TYPES = new Set(["tier_up"]);
const NOTABLE_TYPES = new Set(["quest_completed", "referral_milestone", "event_organized"]);

function getTierNameClass(tier: string) {
  if (tier === "legend") return "font-display font-semibold";
  if (tier === "ambassador") return "font-display font-medium";
  return "font-sans";
}

function getTierAvatarClass(tier: string) {
  if (tier === "legend") return "ring-2 ring-foreground/20";
  return "";
}

function BigFeedItem({ activity }: { activity: ActivityWithUser }) {
  const Icon = activityIcons[activity.type] || MessageSquare;
  const verb = activityVerbs[activity.type] || "performed an action";
  const meta = activity.metadata as Record<string, string> | null;

  return (
    <Card className="border-0 shadow-none" data-testid={`feed-item-${activity.id}`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Link href={`/contributors/${activity.userId}`}>
            <ContributorAvatar user={activity.user} size="lg" isActive />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground shrink-0">
                {formatTimeAgo(activity.createdAt)}
              </span>
            </div>
            <p className="font-display font-semibold text-2xl mt-2 leading-tight">
              <Link href={`/contributors/${activity.userId}`}>
                <span className="cursor-pointer" data-testid={`text-feed-username-${activity.id}`}>
                  {activity.user?.username ?? "Unknown"}
                </span>
              </Link>{" "}
              <span className="text-muted-foreground font-normal text-lg">{verb}</span>
            </p>
            {meta?.newTier && (
              <p className="text-sm mt-2 text-muted-foreground">
                Promoted to <span className="font-display font-semibold text-foreground capitalize">{meta.newTier}</span>
              </p>
            )}
            {meta?.topicTitle && (
              <p className="text-sm mt-2 text-muted-foreground">{meta.topicTitle}</p>
            )}
            {meta?.imageUrl && (
              <div className="mt-3 rounded-[10px] overflow-hidden bg-muted" data-testid={`img-feed-event-${activity.id}`}>
                <img
                  src={meta.imageUrl}
                  alt={meta?.eventName || "Event"}
                  className="w-full h-48 object-cover"
                />
              </div>
            )}
            {meta?.contentPreview && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-3 leading-relaxed">
                {meta.contentPreview}
              </p>
            )}
            {meta?.topicId && (
              <div className="mt-3">
                <Link href={`/forum/all/${meta.topicId}`}>
                  <span className="text-xs text-muted-foreground font-medium cursor-pointer" data-testid={`link-thread-${activity.id}`}>
                    View thread
                  </span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function NotableFeedItem({ activity }: { activity: ActivityWithUser }) {
  const Icon = activityIcons[activity.type] || MessageSquare;
  const verb = activityVerbs[activity.type] || "performed an action";
  const meta = activity.metadata as Record<string, string> | null;

  return (
    <Card className="border-0 shadow-none" data-testid={`feed-item-${activity.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Link href={`/contributors/${activity.userId}`}>
            <ContributorAvatar user={activity.user} size="sm" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm">
                <Link href={`/contributors/${activity.userId}`}>
                  <span className="font-medium cursor-pointer" data-testid={`text-feed-username-${activity.id}`}>
                    {activity.user?.username ?? "Unknown"}
                  </span>
                </Link>{" "}
                <span className="text-muted-foreground">{verb}</span>
              </p>
              <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground ml-auto shrink-0">
                {formatTimeAgo(activity.createdAt)}
              </span>
            </div>
            {meta?.questTitle && (
              <p className="text-sm mt-1 text-muted-foreground">{meta.questTitle}</p>
            )}
            {meta?.eventName && (
              <p className="text-sm mt-1 text-muted-foreground">{meta.eventName}</p>
            )}
            {meta?.imageUrl && (
              <div className="mt-3 rounded-[10px] overflow-hidden bg-muted" data-testid={`img-feed-event-${activity.id}`}>
                <img
                  src={meta.imageUrl}
                  alt={meta?.eventName || "Event"}
                  className="w-full h-40 object-cover"
                />
              </div>
            )}
            {meta?.contentPreview && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed" data-testid={`text-feed-preview-${activity.id}`}>
                {meta.contentPreview}
              </p>
            )}
            {meta?.topicId && (
              <div className="mt-2">
                <Link href={`/forum/all/${meta.topicId}`}>
                  <span className="text-xs text-muted-foreground font-medium cursor-pointer" data-testid={`link-thread-${activity.id}`}>
                    View thread
                  </span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AmbientFeedItem({ activity }: { activity: ActivityWithUser }) {
  const Icon = activityIcons[activity.type] || MessageSquare;
  const verb = activityVerbs[activity.type] || "performed an action";
  const meta = activity.metadata as Record<string, string> | null;

  return (
    <div className="flex items-center gap-3 py-2" data-testid={`feed-item-${activity.id}`}>
      <Link href={`/contributors/${activity.userId}`}>
        <ContributorAvatar user={activity.user} size="xs" />
      </Link>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground leading-snug">
          <Link href={`/contributors/${activity.userId}`}>
            <span className="font-medium cursor-pointer text-foreground" data-testid={`text-feed-username-${activity.id}`}>
              {activity.user?.username ?? "Unknown"}
            </span>
          </Link>{" "}
          {verb}
          {meta?.topicTitle && (
            <span> &middot; {meta.topicTitle}</span>
          )}
        </p>
      </div>
      <Icon className="w-3 h-3 text-muted-foreground shrink-0" />
      <span className="text-[10px] text-muted-foreground shrink-0">
        {formatTimeAgo(activity.createdAt)}
      </span>
    </div>
  );
}

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [feedTab, setFeedTab] = useState<"newest" | "trending">("newest");

  const { data: members } = useQuery<User[]>({
    queryKey: ["/api/members"],
  });

  const { data: activities } = useQuery<ActivityWithUser[]>({
    queryKey: ["/api/activities"],
  });

  const { data: categories } = useQuery<ForumCategory[]>({
    queryKey: ["/api/forum/categories"],
  });

  const { data: recentTopics } = useQuery<TopicWithAuthor[]>({
    queryKey: ["/api/forum/recent-topics?limit=8"],
  });

  const eventActivities = activities?.filter(
    (a) => a.type === "event_organized"
  );

  const trendingActivities = activities
    ? [...activities].sort(() => 0.5 - Math.random()).slice(0, 8)
    : [];

  const feedItems = feedTab === "newest" ? activities : trendingActivities;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-6xl mx-auto flex gap-8 p-6 lg:p-10">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-6">
            <Button
              variant={feedTab === "newest" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFeedTab("newest")}
              data-testid="tab-newest"
            >
              Newest
            </Button>
            <Button
              variant={feedTab === "trending" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFeedTab("trending")}
              data-testid="tab-trending"
            >
              Trending
            </Button>
          </div>

          {!isAuthenticated && (
            <Card className="mb-6 border-0 shadow-none" data-testid="welcome-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <h2 className="font-display font-semibold text-lg" data-testid="text-welcome-heading">Welcome to Insidr</h2>
                    <p className="font-sans text-sm text-muted-foreground mt-1">
                      Sign up or login to join the contributor program, track KPIs, and level up your tier.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href="/login">
                      <Button variant="outline" data-testid="button-welcome-login">Login</Button>
                    </Link>
                    <Link href="/signup">
                      <Button data-testid="button-welcome-signup">Sign Up</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {eventActivities && eventActivities.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between gap-2 mb-4">
                <h3 className="font-display font-semibold text-xs uppercase tracking-widest text-muted-foreground" data-testid="text-event-stream-heading">
                  Recent Events
                </h3>
                <Link href="/activity">
                  <ArrowRight className="w-4 h-4 text-muted-foreground cursor-pointer" data-testid="link-view-all-events" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {eventActivities.slice(0, 4).map((event) => {
                  const meta = event.metadata as Record<string, string> | null;
                  const topicId = meta?.topicId;
                  const imageUrl = meta?.imageUrl;
                  const preview = meta?.contentPreview;

                  const cardInner = (
                    <Card className={`border-0 shadow-none rounded-[10px] overflow-hidden ${topicId ? "group hover-elevate cursor-pointer" : ""}`} data-testid={`card-event-${event.id}`}>
                      <CardContent className="p-0">
                        {imageUrl && (
                          <div className="w-full h-36 overflow-hidden bg-muted" data-testid={`img-event-${event.id}`}>
                            <img
                              src={imageUrl}
                              alt={meta?.eventName}
                              className={`w-full h-full object-cover ${topicId ? "transition-transform duration-500 group-hover:scale-105" : ""}`}
                            />
                          </div>
                        )}
                        <div className="p-4">
                          <div className="flex items-start gap-3">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground mt-1 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="font-display font-medium text-sm leading-snug" data-testid={`text-event-name-${event.id}`}>
                                {meta?.eventName || "Event"}
                              </p>
                              {preview && (
                                <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed" data-testid={`text-event-preview-${event.id}`}>
                                  {preview}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-3">
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold" data-testid={`text-event-author-${event.id}`}>
                                  {event.user?.username}
                                </span>
                                <span className="text-[10px] text-muted-foreground/60">
                                  {formatTimeAgo(event.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );

                  if (topicId) {
                    return (
                      <Link key={event.id} href={`/forum/all/${topicId}`}>
                        {cardInner}
                      </Link>
                    );
                  }

                  return <div key={event.id}>{cardInner}</div>;
                })}
              </div>
            </div>
          )}

          {recentTopics && recentTopics.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between gap-2 mb-4">
                <h3 className="font-display font-semibold text-xs uppercase tracking-widest text-muted-foreground" data-testid="text-discussions-heading">
                  Forum Discussions
                </h3>
                <Link href="/forum">
                  <ArrowRight className="w-4 h-4 text-muted-foreground cursor-pointer" data-testid="link-view-all-forum" />
                </Link>
              </div>
              <Card className="border-0 shadow-none">
                <CardContent className="p-0">
                  {recentTopics.slice(0, 6).map((topic, idx) => (
                    <Link key={topic.id} href={`/forum/all/${topic.id}`}>
                      <div
                        className={`flex items-start gap-3 p-4 hover-elevate cursor-pointer ${idx < recentTopics.slice(0, 6).length - 1 ? "border-b border-border" : ""}`}
                        data-testid={`card-topic-${topic.id}`}
                      >
                        <ContributorAvatar user={topic.author} size="xs" />
                        <div className="min-w-0 flex-1">
                          <p className="font-display font-medium text-sm leading-snug line-clamp-1" data-testid={`text-topic-title-${topic.id}`}>
                            {topic.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs ${getTierNameClass(topic.author.tier)}`}>
                              {topic.author.username}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(topic.createdAt)}
                            </span>
                            {(topic.replyCount ?? 0) > 0 && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MessageSquare className="w-3 h-3" />
                                <span className="font-mono">{topic.replyCount}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          <div className="mb-4">
            <h3 className="font-display font-semibold text-xs uppercase tracking-widest text-muted-foreground" data-testid="text-activity-heading">
              Activity Feed
            </h3>
          </div>

          <div className="space-y-1">
            {feedItems?.map((activity) => {
              if (BIG_TYPES.has(activity.type)) {
                return (
                  <div key={activity.id} className="py-3">
                    <BigFeedItem activity={activity} />
                  </div>
                );
              }
              if (NOTABLE_TYPES.has(activity.type)) {
                return (
                  <div key={activity.id} className="py-1">
                    <NotableFeedItem activity={activity} />
                  </div>
                );
              }
              return <AmbientFeedItem key={activity.id} activity={activity} />;
            })}
            {(!feedItems || feedItems.length === 0) && (
              <div className="text-center py-20">
                <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No activity yet. Start a discussion!</p>
              </div>
            )}
          </div>
        </div>

        <div className="hidden lg:block w-72 shrink-0 space-y-6">
          <Card className="border-0 shadow-none">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-2 mb-4">
                <h3 className="font-display font-semibold text-xs uppercase tracking-widest text-muted-foreground">Top Contributors</h3>
                <Link href="/leaderboard">
                  <ArrowRight className="w-4 h-4 text-muted-foreground cursor-pointer" data-testid="link-view-leaderboard" />
                </Link>
              </div>
              <div className="space-y-1">
                {members?.slice(0, 5).map((member) => {
                  const nameClass = getTierNameClass(member.tier);
                  const avatarRing = getTierAvatarClass(member.tier);
                  return (
                    <Link key={member.id} href={`/contributors/${member.id}`}>
                      <div className="flex items-center gap-3 p-2 rounded-md hover-elevate cursor-pointer" data-testid={`sidebar-member-${member.id}`}>
                        <div className={`w-7 h-7 rounded-full overflow-hidden shrink-0 ${avatarRing}`}>
                          <img src={getAvatarUrl(member.username)} alt={member.username} className="w-full h-full object-cover" />
                        </div>
                        <span className={`text-sm truncate flex-1 ${nameClass}`}>{member.username}</span>
                        <span className="font-mono text-sm text-muted-foreground tabular-nums shrink-0">
                          {member.totalPoints}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-none">
            <CardContent className="p-5">
              <h3 className="font-display font-semibold text-xs uppercase tracking-widest text-muted-foreground mb-4">Categories</h3>
              <div className="space-y-1">
                {categories?.map((cat) => (
                  <Link key={cat.id} href={`/forum/${cat.id}`}>
                    <div className="flex items-center justify-between gap-3 p-2 rounded-md hover-elevate cursor-pointer">
                      <span className="text-sm font-medium truncate">{cat.name}</span>
                      <span className="font-mono text-xs text-muted-foreground shrink-0">
                        {cat.topicCount ?? 0}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
