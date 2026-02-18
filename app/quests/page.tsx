"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Target,
  Check,
  Play,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/lib/wallet-context";
import { WalletButton } from "@/components/wallet-button";
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

const categories = ["all", "referrals", "content", "events", "sponsors", "community"];

export default function Quests() {
  const { isConnected } = useWallet();
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState("all");

  const { data: allQuests, isLoading: questsLoading } = useQuery<Quest[]>({
    queryKey: ["/api/quests"],
  });

  const { data: myCompletions } = useQuery<QuestCompletionWithQuest[]>({
    queryKey: ["/api/quests/my"],
    enabled: isConnected,
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

  if (!isConnected) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Target className="w-12 h-12 text-muted-foreground mb-4" />
            <h2 className="font-display font-semibold text-xl mb-2">Connect to View Quests</h2>
            <p className="font-sans text-sm text-muted-foreground mb-8 max-w-md">
              Connect your wallet to browse and complete quests to earn points and advance your tier.
            </p>
            <WalletButton />
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
          <span className="text-xs text-muted-foreground" data-testid="text-completed-count">
            {myCompletions?.filter((c) => c.status === "completed").length ?? 0} completed
          </span>
        </div>

        <div className="flex items-center gap-2 mb-8 overflow-x-auto flex-wrap">
          {categories.map((cat) => {
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
                    <div className="shrink-0">
                      {isCompleted ? (
                        <span className="text-xs text-muted-foreground">Completed</span>
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
    </div>
  );
}
