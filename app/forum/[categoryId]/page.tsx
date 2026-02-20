"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MessageSquare,
  Pin,
  Plus,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAvatarUrl } from "@/lib/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
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
import type { ForumCategory, ForumTopic, User } from "@/shared/schema";

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

export default function ForumCategoryPage() {
  const params = useParams() as { categoryId: string };
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [newTopicOpen, setNewTopicOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { data: category } = useQuery<ForumCategory>({
    queryKey: ["/api/forum/categories", params.categoryId],
  });

  const { data: topics, isLoading } = useQuery<(ForumTopic & { author: User })[]>({
    queryKey: ["/api/forum/categories", params.categoryId, "topics"],
  });

  const createTopicMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/forum/topics`, {
        categoryId: params.categoryId,
        title,
        content,
        authorId: user!.id,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forum/categories", params.categoryId, "topics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/forum/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      setNewTopicOpen(false);
      setTitle("");
      setContent("");
      toast({ title: "Topic created" });
    },
  });

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto p-5 sm:p-8">
        <Link href="/forum">
          <Button variant="ghost" size="sm" className="gap-1.5 mb-4" data-testid="button-back-forum">
            <ArrowLeft className="w-4 h-4" /> Forum
          </Button>
        </Link>

        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-xl font-display font-semibold">{category?.name ?? "Category"}</h1>
            {category?.description && (
              <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
            )}
          </div>
          {isAuthenticated && (
            <Dialog open={newTopicOpen} onOpenChange={setNewTopicOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5" data-testid="button-new-topic">
                  <Plus className="w-4 h-4" /> New Topic
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Topic</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <Label className="mb-1.5 block">Title</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="What's on your mind?"
                      data-testid="input-topic-title"
                    />
                  </div>
                  <div>
                    <Label className="mb-1.5 block">Content</Label>
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Share your thoughts..."
                      className="min-h-[140px]"
                      data-testid="input-topic-content"
                    />
                  </div>
                  <Button
                    onClick={() => createTopicMutation.mutate()}
                    className="w-full"
                    disabled={!title.trim() || !content.trim() || createTopicMutation.isPending}
                    data-testid="button-submit-topic"
                  >
                    {createTopicMutation.isPending ? "Creating..." : "Post Topic"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="p-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="py-4 px-3">
                  <Skeleton className="h-4 w-3/4 mb-2.5" />
                  <Skeleton className="h-3.5 w-full mb-2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              ))}
            </CardContent>
          </Card>
        ) : topics?.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold mb-1">No topics yet</h3>
            <p className="text-sm text-muted-foreground">
              {isAuthenticated ? "Be the first to start a discussion!" : "Login to start a discussion."}
            </p>
          </div>
        ) : (
          <Card>
            <CardContent className="p-2">
              {topics?.map((topic, i) => (
                <div key={topic.id}>
                  {i > 0 && <div className="px-3"><Separator /></div>}
                  <Link href={`/forum/${params.categoryId}/${topic.id}`}>
                    <div className="flex items-start gap-3.5 py-4 px-3 rounded-md hover-elevate cursor-pointer" data-testid={`card-topic-${topic.id}`}>
                      <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 mt-0.5">
                        <img src={getAvatarUrl(topic.author?.username || "Anonymous")} alt={topic.author?.username || "Anonymous"} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {topic.isPinned && <Pin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                          <h3 className="font-display font-semibold text-sm">{topic.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{topic.content}</p>
                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                          <span className="text-xs text-muted-foreground font-medium">
                            {topic.author?.username ?? "Unknown"}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {formatTimeAgo(topic.createdAt)}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" /> <span className="font-mono">{topic.replyCount ?? 0}</span> replies
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
