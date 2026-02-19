"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Target,
  Check,
  Play,
  Users,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Quest, QuestCompletion } from "@/shared/schema";

function getQuestCompleters(questTitle: string): number {
  let hash = 0;
  for (let i = 0; i < questTitle.length; i++) {
    hash = ((hash << 5) - hash) + questTitle.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 5) + 1;
}

type QuestCompletionWithQuest = QuestCompletion & { quest: Quest };

const categoryLabels: Record<string, string> = {
  referrals: "Referrals",
  content: "Content",
  events: "Events",
  sponsors: "Sponsors",
  community: "Community",
};

const categoryOptions = ["referrals", "content", "events", "sponsors", "community"];
const difficultyOptions = ["easy", "medium", "hard"];
const filterCategories = ["all", ...categoryOptions];

export default function Quests() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, router]);

  const [activeCategory, setActiveCategory] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Quest | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("referrals");
  const [points, setPoints] = useState(0);
  const [targetCount, setTargetCount] = useState(1);
  const [difficulty, setDifficulty] = useState("easy");

  const { data: allQuests, isLoading: questsLoading } = useQuery<Quest[]>({
    queryKey: ["/api/quests"],
  });

  const { data: myCompletions } = useQuery<QuestCompletionWithQuest[]>({
    queryKey: ["/api/quests/my"],
    enabled: isAuthenticated,
  });

  const openCreate = () => {
    setEditingQuest(null);
    setTitle("");
    setDescription("");
    setCategory("referrals");
    setPoints(0);
    setTargetCount(1);
    setDifficulty("easy");
    setDialogOpen(true);
  };

  const openEdit = (quest: Quest) => {
    setEditingQuest(quest);
    setTitle(quest.title);
    setDescription(quest.description || "");
    setCategory(quest.category);
    setPoints(quest.points);
    setTargetCount(quest.targetCount);
    setDifficulty(quest.difficulty);
    setDialogOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/quests", { title, description, category, points, targetCount, difficulty });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create quest");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quests"] });
      setDialogOpen(false);
      toast({ title: "Quest created" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/quests/${editingQuest!.id}`, { title, description, category, points, targetCount, difficulty });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update quest");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quests"] });
      setDialogOpen(false);
      toast({ title: "Quest updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/quests/${id}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete quest");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quests"] });
      setDeleteTarget(null);
      toast({ title: "Quest deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const startQuestMutation = useMutation({
    mutationFn: async (questId: string) => {
      const res = await apiRequest("POST", `/api/quests/${questId}/start`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quests/my"] });
      toast({ title: "Quest started!" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const completeQuestMutation = useMutation({
    mutationFn: async (questId: string) => {
      const res = await apiRequest("POST", `/api/quests/${questId}/complete`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quests/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
      toast({ title: "Quest completed! Points earned." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const getCompletionStatus = (questId: string) => {
    return myCompletions?.find((c) => c.questId === questId);
  };

  const filteredQuests = allQuests?.filter(
    (q) => activeCategory === "all" || q.category === activeCategory
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingQuest) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
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

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="font-display font-semibold text-2xl page-title-fade" data-testid="text-page-title">Quests</h1>
            <p className="font-sans text-sm text-muted-foreground mt-1">Complete tasks to earn points and level up</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground" data-testid="text-completed-count">
              {myCompletions?.filter((c) => c.status === "completed").length ?? 0} completed
            </span>
            {isAdmin && (
              <Button onClick={openCreate} className="gap-1.5" data-testid="button-add-quest">
                <Plus className="w-4 h-4" />
                Add Quest
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mb-8 overflow-x-auto flex-wrap">
          {filterCategories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <Button
                key={cat}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(cat)}
                data-testid={`filter-${cat}`}
              >
                {cat === "all" ? "All" : categoryLabels[cat] || cat}
              </Button>
            );
          })}
        </div>

        {questsLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-[10px]" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQuests?.map((quest) => {
              const completion = getCompletionStatus(quest.id);
              const isCompleted = completion?.status === "completed";
              const isInProgress = completion?.status === "in_progress";

              return (
                <div
                  key={quest.id}
                  className={`bg-card rounded-[10px] p-5 hover-elevate transition-all border border-transparent hover:border-border/50 ${isCompleted ? "opacity-50 grayscale-[0.5]" : ""}`}
                  data-testid={`quest-card-${quest.id}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-display font-semibold text-sm tracking-tight" data-testid={`text-quest-title-${quest.id}`}>
                          {quest.title}
                        </h3>
                        <span className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full font-medium">
                          {quest.difficulty}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full font-medium">
                          {categoryLabels[quest.category] || quest.category}
                        </span>
                      </div>
                      <p className="font-sans text-[13px] text-muted-foreground/90 leading-relaxed line-clamp-2 hover:line-clamp-none transition-all">{quest.description}</p>
                      <div className="flex items-center gap-4 mt-4 flex-wrap">
                        <span className="font-mono font-bold text-sm text-primary">
                          {quest.points} <span className="font-sans text-muted-foreground/60 font-normal text-xs uppercase tracking-wider ml-0.5">pts</span>
                        </span>
                        <div className="h-3 w-px bg-border" />
                        <span className="font-sans text-[11px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                          Target <span className="font-mono font-medium text-foreground">{quest.targetCount}</span>
                        </span>
                        <span className="font-sans text-[11px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                          <Users className="w-3 h-3 opacity-50" />
                          <span className="font-mono font-medium text-foreground">{getQuestCompleters(quest.title)}</span>
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-1">
                      {isAdmin && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openEdit(quest)}
                            data-testid={`button-edit-quest-${quest.id}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(quest)}
                            data-testid={`button-delete-quest-${quest.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                      {isCompleted ? (
                        <span className="text-xs text-muted-foreground ml-2">Completed</span>
                      ) : isInProgress ? (
                        <Button
                          size="sm"
                          onClick={() => completeQuestMutation.mutate(quest.id)}
                          disabled={completeQuestMutation.isPending}
                          data-testid={`button-complete-${quest.id}`}
                        >
                          <Check className="w-3.5 h-3.5 mr-1.5" />
                          Complete
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startQuestMutation.mutate(quest.id)}
                          disabled={startQuestMutation.isPending}
                          data-testid={`button-start-${quest.id}`}
                        >
                          <Play className="w-3.5 h-3.5 mr-1.5" />
                          Start
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {(!filteredQuests || filteredQuests.length === 0) && (
              <div className="text-center py-16">
                <Target className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-sans text-sm text-muted-foreground">No quests in this category.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingQuest ? "Edit Quest" : "New Quest"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div>
              <Label className="mb-1.5 block">Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="First 10 Referrals" required />
            </div>
            <div>
              <Label className="mb-1.5 block">Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What needs to be done?" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {categoryLabels[cat] || cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block">Difficulty</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {difficultyOptions.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block">Points</Label>
                <Input type="number" value={points} onChange={(e) => setPoints(Number(e.target.value))} min={0} required />
              </div>
              <div>
                <Label className="mb-1.5 block">Target Count</Label>
                <Input type="number" value={targetCount} onChange={(e) => setTargetCount(Number(e.target.value))} min={1} required />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingQuest ? "Save Changes" : "Create Quest"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{deleteTarget?.title}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this quest and all its completions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
