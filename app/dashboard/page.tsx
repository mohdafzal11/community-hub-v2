"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Users,
  UserPlus,
  FileText,
  Calendar,
  Target,
  TrendingUp,
  Copy,
  Check,
  ArrowRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import { ContributionTimeline, generateMockWeeklyData } from "@/components/contribution-timeline";
import type { User, QuestCompletion, Quest, Activity } from "@/shared/schema";

type QuestCompletionWithQuest = QuestCompletion & { quest: Quest };

const tierConfig: Record<string, { label: string; next: string | null; requiredReferrals: number; requiredEvents: number }> = {
  contributor: { label: "Contributor", next: "ambassador", requiredReferrals: 150, requiredEvents: 1 },
  ambassador: { label: "Ambassador", next: "fellow", requiredReferrals: 700, requiredEvents: 6 },
  fellow: { label: "Fellow", next: null, requiredReferrals: 1000, requiredEvents: 10 },
};

const tierOrder = ["contributor", "ambassador", "fellow"];

function ActivityTicker({ activities }: { activities: Activity[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (activities.length === 0) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % activities.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [activities.length]);

  if (activities.length === 0) return null;

  const activity = activities[index];
  const meta = activity.metadata as Record<string, unknown>;
  let text = "";
  if (activity.type === "tier_up") text = `${meta?.username ?? "Someone"} reached ${meta?.newTier}`;
  else if (activity.type === "quest_completed") text = `${meta?.username ?? "Someone"} completed ${meta?.questTitle}`;
  else if (activity.type === "referral_milestone") text = `${meta?.username ?? "Someone"} hit ${meta?.count} referrals`;
  else if (activity.type === "new_contributor") text = `${meta?.username ?? "Someone"} joined the program`;
  else text = `${meta?.username ?? "Someone"}: ${activity.type.replace(/_/g, " ")}`;

  return (
    <div
      className="flex items-center gap-2 h-8 overflow-hidden"
      data-testid="activity-ticker"
    >
      <span className="active-dot shrink-0" />
      <span
        key={index}
        className="text-sm text-muted-foreground truncate"
        style={{ animation: "fade-in-banner 400ms var(--ease-slow) both" }}
      >
        {text}
      </span>
    </div>
  );
}

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  const { data: stats } = useQuery<{ totalContributors: number; totalReferrals: number; totalEvents: number; totalContent: number }>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: myQuests } = useQuery<QuestCompletionWithQuest[]>({
    queryKey: ["/api/quests/my"],
    enabled: isAuthenticated,
  });

  const { data: activities } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
    enabled: isAuthenticated,
  });

  const copyReferralCode = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          <div className="flex flex-col items-center justify-center py-20">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
      </div>
    );
  }

  const currentTier = tierConfig[user?.tier ?? "contributor"];
  const currentTierIndex = tierOrder.indexOf(user?.tier ?? "contributor");
  const nextTier = currentTier?.next ? tierConfig[currentTier.next] : null;
  const referralProgress = nextTier ? Math.min(100, ((user?.referralsCount ?? 0) / nextTier.requiredReferrals) * 100) : 100;
  const eventProgress = nextTier ? Math.min(100, ((user?.eventsCount ?? 0) / nextTier.requiredEvents) * 100) : 100;

  const activeQuests = myQuests?.filter((q) => q.status === "in_progress") ?? [];
  const completedQuests = myQuests?.filter((q) => q.status === "completed") ?? [];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto p-8">
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <div>
            <h1 className="font-display font-semibold text-2xl page-title-fade" data-testid="text-page-title">Dashboard</h1>
            <p className="font-sans text-sm text-muted-foreground mt-1">Welcome back, {user?.username}</p>
          </div>
          <span className="text-xs uppercase tracking-[0.05em] text-muted-foreground" data-testid="badge-current-tier">
            {currentTier?.label}
          </span>
        </div>

        {activities && activities.length > 0 && (
          <div className="mb-8">
            <ActivityTicker activities={activities.slice(0, 8)} />
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-card rounded-[10px] p-5" data-testid="stat-referrals">
            <div className="flex items-center gap-2 mb-3">
              <UserPlus className="w-3.5 h-3.5 text-muted-foreground/70" />
              <span className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground font-semibold">Referrals</span>
            </div>
            <p className="font-mono font-bold text-2xl tracking-tight" data-testid="text-referrals-count">{user?.referralsCount ?? 0}</p>
          </div>
          <div className="bg-card rounded-[10px] p-5" data-testid="stat-content">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-3.5 h-3.5 text-muted-foreground/70" />
              <span className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground font-semibold">Content</span>
            </div>
            <p className="font-mono font-bold text-2xl tracking-tight" data-testid="text-content-count">{user?.contentCount ?? 0}</p>
          </div>
          <div className="bg-card rounded-[10px] p-5" data-testid="stat-events">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground/70" />
              <span className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground font-semibold">Events</span>
            </div>
            <p className="font-mono font-bold text-2xl tracking-tight" data-testid="text-events-count">{user?.eventsCount ?? 0}</p>
          </div>
          <div className="bg-card rounded-[10px] p-5" data-testid="stat-points">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-3.5 h-3.5 text-muted-foreground/70" />
              <span className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground font-semibold">Points</span>
            </div>
            <p className="font-mono font-bold text-2xl tracking-tight" data-testid="text-points-count">{user?.totalPoints ?? 0}</p>
          </div>
        </div>

        {user && (
          <div className="bg-card rounded-[10px] p-6 mb-8">
            <h3 className="text-xs uppercase tracking-[0.05em] text-muted-foreground font-medium mb-4">Your Activity</h3>
            <ContributionTimeline weeks={generateMockWeeklyData(user.totalPoints, user.eventsCount)} variant="full" />
            <p className="text-xs text-muted-foreground mt-2">Last 12 weeks</p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-card rounded-[10px] p-6">
              <h3 className="font-display font-semibold text-xs uppercase tracking-[0.05em] text-muted-foreground mb-4">Tier Progression</h3>
              <div className="flex items-center gap-3 mb-6 flex-wrap">
                {tierOrder.map((t, i) => {
                  const conf = tierConfig[t];
                  const isCurrentOrPast = i <= currentTierIndex;
                  return (
                    <div key={t} className="flex items-center gap-3 flex-wrap">
                      {i > 0 && (
                        <div className={`w-8 h-0.5 ${i <= currentTierIndex ? "bg-primary" : "bg-border"}`} />
                      )}
                      <span className={`px-3 py-1.5 rounded-[6px] text-sm ${isCurrentOrPast ? "text-foreground font-medium bg-muted" : "text-muted-foreground"}`}>
                        {conf.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              {nextTier && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-sans text-sm">Referrals</span>
                      <span className="font-mono text-sm text-muted-foreground">{user?.referralsCount ?? 0} / {nextTier.requiredReferrals}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${referralProgress}%` }} data-testid="progress-referrals" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-sans text-sm">Events Organized</span>
                      <span className="font-mono text-sm text-muted-foreground">{user?.eventsCount ?? 0} / {nextTier.requiredEvents}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${eventProgress}%` }} data-testid="progress-events" />
                    </div>
                  </div>
                </div>
              )}
              {!nextTier && (
                <p className="font-sans text-sm text-muted-foreground">You've reached the highest tier.</p>
              )}
            </div>

            <div className="bg-card rounded-[10px] p-6">
              <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                <h3 className="font-display font-semibold text-xs uppercase tracking-[0.05em] text-muted-foreground">Active Quests</h3>
                <Link href="/quests">
                  <Button variant="ghost" size="sm" className="gap-1" data-testid="link-view-all-quests">
                    View All <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
              {activeQuests.length > 0 ? (
                <div className="space-y-2">
                  {activeQuests.slice(0, 3).map((qc) => (
                    <div key={qc.id} className="flex items-center gap-3 p-3 rounded-[6px] border" data-testid={`quest-active-${qc.id}`}>
                      <Target className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-display text-sm font-medium truncate">{qc.quest.title}</p>
                        <p className="font-sans text-xs text-muted-foreground">
                          <span className="font-mono">{qc.progress}</span> / <span className="font-mono">{qc.quest.targetCount}</span>
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">In Progress</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="font-sans text-sm text-muted-foreground">No active quests.</p>
                  <Link href="/quests">
                    <Button variant="outline" size="sm" className="mt-4 gap-1.5" data-testid="button-start-quest">
                      <Target className="w-3.5 h-3.5" /> Browse Quests
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-card rounded-[10px] p-6">
              <h3 className="font-display font-semibold text-xs uppercase tracking-[0.05em] text-muted-foreground mb-4">Referral Code</h3>
              <button
                onClick={copyReferralCode}
                className="flex items-center gap-2 w-full p-3 rounded-[6px] border hover-elevate text-sm font-mono"
                data-testid="button-copy-referral"
              >
                <span className="flex-1 truncate text-left">{user?.referralCode || "N/A"}</span>
                {copied ? <Check className="w-4 h-4 text-muted-foreground shrink-0" /> : <Copy className="w-4 h-4 text-muted-foreground shrink-0" />}
              </button>
              <p className="font-sans text-xs text-muted-foreground mt-2">Share this code to track your referrals</p>
            </div>

            <div className="bg-card rounded-[10px] p-6">
              <h3 className="font-display font-semibold text-xs uppercase tracking-[0.05em] text-muted-foreground mb-4">Program Stats</h3>
              {stats ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-sm text-muted-foreground">Total Contributors</span>
                    <span className="font-mono text-sm font-semibold" data-testid="text-total-contributors">{stats.totalContributors}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-sm text-muted-foreground">Total Referrals</span>
                    <span className="font-mono text-sm font-semibold" data-testid="text-total-referrals">{stats.totalReferrals}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-sm text-muted-foreground">Events Organized</span>
                    <span className="font-mono text-sm font-semibold" data-testid="text-total-events">{stats.totalEvents}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-sm text-muted-foreground">Content Created</span>
                    <span className="font-mono text-sm font-semibold" data-testid="text-total-content">{stats.totalContent}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-5 w-full" />
                  ))}
                </div>
              )}
            </div>

            <div className="bg-card rounded-[10px] p-6">
              <h3 className="font-display font-semibold text-xs uppercase tracking-[0.05em] text-muted-foreground mb-3">Quests Completed</h3>
              <p className="font-mono font-bold text-3xl" data-testid="text-quests-completed">{user?.questsCompleted ?? 0}</p>
              {completedQuests.length > 0 && (
                <div className="mt-4 space-y-2">
                  {completedQuests.slice(0, 3).map((qc) => (
                    <div key={qc.id} className="flex items-center gap-2 text-sm">
                      <Check className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate text-muted-foreground font-sans">{qc.quest.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
