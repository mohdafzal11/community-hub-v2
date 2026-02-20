"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Copy,
  Check,
  Edit2,
  ChevronRight,
  MapPin,
  GraduationCap,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ContributorAvatar } from "@/components/contributor-avatar";
import { ContributionTimeline, generateMockWeeklyData } from "@/components/contribution-timeline";
import type { User, ForumTopic, Activity } from "@/shared/schema";
import { FaXTwitter } from "react-icons/fa6";

const tierLabels: Record<string, string> = {
  contributor: "Contributor",
  ambassador: "Ambassador",
  fellow: "Fellow",
  regional_lead: "Regional Lead",
};

const roleLabels: Record<string, string> = {
  admin: "Admin",
  contributor: "Contributor",
  ambassador: "Ambassador",
};

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const masked = local[0] + "***";
  return `${masked}@${domain}`;
}

function formatTimeAgo(date: Date | string) {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);
  const months = Math.floor(days / 30);
  if (months > 0) return `${months} month${months > 1 ? "s" : ""} ago`;
  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  return "today";
}

export default function ContributorProfile() {
  const params = useParams() as { id: string };
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const { data: member, isLoading } = useQuery<User>({
    queryKey: ["/api/members", params.id],
  });

  const { data: contributions } = useQuery<ForumTopic[]>({
    queryKey: ["/api/members", params.id, "topics"],
  });

  const { data: allActivities } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  const isOwnProfile = currentUser?.id === member?.id;

  const [editForm, setEditForm] = useState({
    username: "",
    bio: "",
    skillTags: "",
    xHandle: "",
    telegramHandle: "",
    college: "",
    city: "",
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("PATCH", `/api/members/${params.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members", params.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      setEditOpen(false);
      toast({ title: "Profile updated" });
    },
  });

  const copyEmail = () => {
    if (member) {
      navigator.clipboard.writeText(member.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openEdit = () => {
    if (member) {
      setEditForm({
        username: member.username,
        bio: member.bio ?? "",
        skillTags: member.skillTags?.join(", ") ?? "",
        xHandle: member.xHandle ?? "",
        telegramHandle: member.telegramHandle ?? "",
        college: member.college ?? "",
        city: member.city ?? "",
      });
      setEditOpen(true);
    }
  };

  const saveEdit = () => {
    updateMutation.mutate({
      username: editForm.username,
      bio: editForm.bio,
      skillTags: editForm.skillTags
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      xHandle: editForm.xHandle,
      telegramHandle: editForm.telegramHandle,
      college: editForm.college,
      city: editForm.city,
    });
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-8 space-y-8">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-48 w-full rounded-[10px]" />
          <Skeleton className="h-36 w-full rounded-[10px]" />
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display font-semibold text-lg">Contributor not found</h2>
          <Link href="/contributors">
            <Button variant="outline" className="mt-4 gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const joinDate = formatTimeAgo(member.joinedAt);
  const weeklyData = generateMockWeeklyData(member.totalPoints, member.eventsCount);
  const memberActivities = allActivities?.filter((a) => a.userId === member.id).slice(0, 5) ?? [];

  const stats = [
    { label: "Referrals", value: member.referralsCount ?? 0, key: "referrals" },
    { label: "Content", value: member.contentCount ?? 0, key: "content" },
    { label: "Events", value: member.eventsCount ?? 0, key: "events" },
    { label: "Sponsor Leads", value: member.sponsorLeadsCount ?? 0, key: "sponsors" },
    { label: "Points", value: member.totalPoints ?? 0, key: "points" },
  ];

  const highestStat = stats.reduce((prev, curr) => (curr.value > prev.value ? curr : prev), stats[0]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto p-8">
        <Link href="/contributors">
          <Button variant="ghost" size="sm" className="gap-2 mb-8" data-testid="button-back-contributors">
            <ArrowLeft className="w-4 h-4" /> Contributors
          </Button>
        </Link>

        <div className="flex items-start gap-6 mb-6 flex-wrap">
          <ContributorAvatar
            user={member}
            size="xl"
            isActive={true}
            hasStreak={member.eventsCount >= 4}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display font-bold text-2xl page-title-fade" data-testid="text-profile-username">
                {member.username}
              </h1>
              <span
                className="text-xs font-sans uppercase tracking-[0.05em] border border-border px-2 py-0.5 rounded-[6px] text-muted-foreground"
                data-testid="badge-tier"
              >
                {tierLabels[member.tier] || member.tier}
              </span>
              <span
                className="text-xs font-sans uppercase tracking-[0.05em] text-muted-foreground border border-border px-2 py-0.5 rounded-[6px]"
                data-testid="badge-role"
              >
                {roleLabels[member.role] || member.role}
              </span>
              {isOwnProfile && (
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                  <DialogTrigger asChild>
                    <Button size="icon" variant="ghost" onClick={openEdit} data-testid="button-edit-profile">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                      <div>
                        <Label className="mb-1.5 block">Username</Label>
                        <Input
                          value={editForm.username}
                          onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                          data-testid="input-edit-username"
                        />
                      </div>
                      <div>
                        <Label className="mb-1.5 block">Bio</Label>
                        <Textarea
                          value={editForm.bio}
                          onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                          data-testid="input-edit-bio"
                        />
                      </div>
                      <div>
                        <Label className="mb-1.5 block">Skills (comma separated)</Label>
                        <Input
                          value={editForm.skillTags}
                          onChange={(e) => setEditForm({ ...editForm, skillTags: e.target.value })}
                          placeholder="Community Building, Events, Web3"
                          data-testid="input-edit-skills"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="mb-1.5 block">City</Label>
                          <Input
                            value={editForm.city}
                            onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                            placeholder="Mumbai"
                            data-testid="input-edit-city"
                          />
                        </div>
                        <div>
                          <Label className="mb-1.5 block">College</Label>
                          <Input
                            value={editForm.college}
                            onChange={(e) => setEditForm({ ...editForm, college: e.target.value })}
                            placeholder="IIT Bombay"
                            data-testid="input-edit-college"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="mb-1.5 block">X Handle</Label>
                          <Input
                            value={editForm.xHandle}
                            onChange={(e) => setEditForm({ ...editForm, xHandle: e.target.value })}
                            placeholder="handle"
                            data-testid="input-edit-x"
                          />
                        </div>
                        <div>
                          <Label className="mb-1.5 block">Telegram</Label>
                          <Input
                            value={editForm.telegramHandle}
                            onChange={(e) => setEditForm({ ...editForm, telegramHandle: e.target.value })}
                            placeholder="handle"
                            data-testid="input-edit-telegram"
                          />
                        </div>
                      </div>
                      <Button
                        onClick={saveEdit}
                        className="w-full"
                        disabled={updateMutation.isPending}
                        data-testid="button-save-profile"
                      >
                        {updateMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            <div className="flex items-center gap-4 mt-2 flex-wrap">
              {member.city && (
                <span className="font-sans text-sm text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> {member.city}
                </span>
              )}
              {member.college && (
                <span className="font-sans text-sm text-muted-foreground flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5" /> {member.college}
                </span>
              )}
              <span className="font-sans text-sm text-muted-foreground">
                Joined {joinDate}
              </span>
              {member.xHandle && (
                <span className="font-sans text-sm text-muted-foreground flex items-center gap-1.5">
                  <FaXTwitter className="w-3 h-3" /> @{member.xHandle}
                </span>
              )}
            </div>

            {member.bio && (
              <p className="font-sans text-sm text-muted-foreground mt-3 leading-relaxed" data-testid="text-profile-bio">
                {member.bio}
              </p>
            )}

            <button
              onClick={copyEmail}
              className="flex items-center gap-2 mt-3 font-mono text-xs text-muted-foreground hover-elevate rounded-md px-1.5 py-0.5 -ml-1.5"
              data-testid="button-copy-email"
            >
              {isOwnProfile ? member.email : maskEmail(member.email)}
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>

        <Card className="mb-6 rounded-[10px]">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-between gap-4">
              {stats.map((stat, i) => (
                <div key={stat.key} className="flex items-center gap-4 group">
                  {i > 0 && <div className="hidden sm:block w-px h-10 bg-border" />}
                  <div className="text-center sm:text-left px-2 flex-1 sm:flex-none">
                    <p
                      className={`text-xl leading-none ${
                        stat.key === highestStat.key
                          ? "font-display font-bold text-primary"
                          : "font-mono"
                      }`}
                      data-testid={`text-profile-${stat.key}`}
                    >
                      {stat.value.toLocaleString()}
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground mt-2 font-semibold">
                      {stat.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 rounded-[10px]">
          <CardContent className="p-6">
            <h3 className="text-xs uppercase tracking-[0.05em] text-muted-foreground font-medium mb-4">
              Contribution Timeline
            </h3>
            <ContributionTimeline weeks={weeklyData} variant="full" />
            <p className="text-xs text-muted-foreground mt-2">Last 12 weeks</p>
          </CardContent>
        </Card>

        {member.skillTags && member.skillTags.length > 0 && (
          <Card className="mb-6 rounded-[10px]">
            <CardContent className="p-6">
              <h3 className="text-xs uppercase tracking-[0.05em] text-muted-foreground font-medium mb-4">
                Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {member.skillTags.map((tag) => (
                  <span
                    key={tag}
                    className="border border-border px-2 py-0.5 rounded-[6px] text-xs text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {memberActivities.length > 0 && (
          <Card className="mb-6 rounded-[10px]">
            <CardContent className="p-6">
              <h3 className="text-xs uppercase tracking-[0.05em] text-muted-foreground font-medium mb-4">
                Recent Activity
              </h3>
              <div className="space-y-3">
                {memberActivities.map((activity) => {
                  const meta = activity.metadata as Record<string, unknown>;
                  let description = "";
                  if (activity.type === "tier_up") description = `Promoted to ${meta?.newTier}`;
                  else if (activity.type === "quest_completed") description = `Completed quest: ${meta?.questTitle}`;
                  else if (activity.type === "referral_milestone") description = `Reached ${meta?.count} referrals`;
                  else if (activity.type === "event_organized") description = `Organized ${meta?.eventName}`;
                  else if (activity.type === "new_topic") description = `Started topic: ${meta?.topicTitle}`;
                  else if (activity.type === "new_contributor") description = "Joined the program";
                  else description = activity.type.replace(/_/g, " ");

                  return (
                    <div key={activity.id} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-foreground/20 shrink-0" />
                      <span className="text-sm text-muted-foreground truncate">{description}</span>
                      <span className="text-xs text-muted-foreground shrink-0 ml-auto">
                        {formatTimeAgo(activity.createdAt)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="rounded-[10px]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
              <h3 className="text-xs uppercase tracking-[0.05em] text-muted-foreground font-medium">
                Forum Contributions
              </h3>
              <span className="font-mono text-xs text-muted-foreground">
                {contributions?.length ?? 0}
              </span>
            </div>
            {contributions && contributions.length > 0 ? (
              <div>
                {contributions.map((topic, i) => (
                  <div key={topic.id}>
                    {i > 0 && <Separator />}
                    <Link href={`/forum/${topic.categoryId}/${topic.id}`}>
                      <div
                        className="flex items-center gap-4 py-3 px-1 rounded-md hover-elevate cursor-pointer"
                        data-testid={`link-contribution-${topic.id}`}
                      >
                        <span className="font-sans text-sm truncate flex-1">{topic.title}</span>
                        <span className="font-sans text-xs text-muted-foreground shrink-0">
                          {new Date(topic.createdAt).toLocaleDateString()}
                        </span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-sans text-sm text-muted-foreground py-2">No forum contributions yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
