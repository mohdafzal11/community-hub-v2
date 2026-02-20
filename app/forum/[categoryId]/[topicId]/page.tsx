"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageSquare, Send, Reply, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAvatarUrl } from "@/lib/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ForumTopic, ForumReply, User } from "@/shared/schema";

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

type ReplyWithAuthor = ForumReply & { author: User };
type TopicWithAuthor = ForumTopic & { author: User };

function ReplyCard({
  reply,
  depth = 0,
  onReply,
}: {
  reply: ReplyWithAuthor & { children?: ReplyWithAuthor[] };
  depth?: number;
  onReply: (parentId: string) => void;
}) {
  const initials = reply.author?.username?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <div className={depth > 0 ? "ml-8 border-l-2 border-border pl-5" : ""}>
      <div className="py-4">
        <div className="flex items-start gap-3">
          <Link href={`/contributors/${reply.authorId}`}>
            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 cursor-pointer">
              <img src={getAvatarUrl(reply.author?.username || "Anonymous")} alt={reply.author?.username || "Anonymous"} className="w-full h-full object-cover" />
            </div>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`/contributors/${reply.authorId}`}>
                <span className="font-semibold text-sm cursor-pointer">{reply.author?.username ?? "Unknown"}</span>
              </Link>
              <span className="text-xs text-muted-foreground">
                {formatTimeAgo(reply.createdAt)}
              </span>
            </div>
            <p className="text-sm mt-1.5 leading-relaxed whitespace-pre-wrap">{reply.content}</p>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 mt-1 text-muted-foreground"
              onClick={() => onReply(reply.id)}
              data-testid={`button-reply-to-${reply.id}`}
            >
              <Reply className="w-3.5 h-3.5" /> Reply
            </Button>
          </div>
        </div>
      </div>
      {reply.children?.map((child) => (
        <ReplyCard key={child.id} reply={child as any} depth={depth + 1} onReply={onReply} />
      ))}
    </div>
  );
}

export default function ForumTopicPage() {
  const params = useParams() as { categoryId: string; topicId: string };
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [replyContent, setReplyContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const { data: topic, isLoading: topicLoading } = useQuery<TopicWithAuthor>({
    queryKey: ["/api/forum/topics", params.topicId],
  });

  const backUrl = params.categoryId === "all" ? "/" : `/forum/${params.categoryId}`;

  const { data: replies, isLoading: repliesLoading } = useQuery<ReplyWithAuthor[]>({
    queryKey: ["/api/forum/topics", params.topicId, "replies"],
  });

  const createReplyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/forum/replies`, {
        topicId: params.topicId,
        content: replyContent,
        authorId: user!.id,
        parentReplyId: replyingTo,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forum/topics", params.topicId, "replies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/forum/topics", params.topicId] });
      queryClient.invalidateQueries({ queryKey: ["/api/forum/categories", params.categoryId, "topics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      setReplyContent("");
      setReplyingTo(null);
      toast({ title: "Reply posted" });
    },
  });

  const handleReply = (parentId: string) => {
    setReplyingTo(parentId);
    const textarea = document.querySelector("[data-testid='input-reply-content']") as HTMLTextAreaElement;
    if (textarea) textarea.focus();
  };

  function buildReplyTree(flatReplies: ReplyWithAuthor[]) {
    const map = new Map<string, ReplyWithAuthor & { children: ReplyWithAuthor[] }>();
    const roots: (ReplyWithAuthor & { children: ReplyWithAuthor[] })[] = [];

    flatReplies.forEach((r) => {
      map.set(r.id, { ...r, children: [] });
    });

    flatReplies.forEach((r) => {
      const node = map.get(r.id)!;
      if (r.parentReplyId && map.has(r.parentReplyId)) {
        map.get(r.parentReplyId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  const replyTree = replies ? buildReplyTree(replies) : [];

  if (topicLoading) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-5 sm:p-8 space-y-5">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-40 w-full rounded-md" />
          <Skeleton className="h-24 w-full rounded-md" />
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-semibold text-lg">Topic not found</h2>
          <Link href={backUrl}>
            <Button variant="outline" className="mt-4 gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const authorInitials = topic.author?.username?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto p-5 sm:p-8">
        <Link href={backUrl}>
          <Button variant="ghost" size="sm" className="gap-1.5 mb-4" data-testid="button-back-category">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        </Link>

        <Card className="mb-5">
          <CardContent className="p-6">
            <h1 className="text-lg font-display font-semibold mb-3" data-testid="text-topic-title">{topic.title}</h1>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <Link href={`/contributors/${topic.authorId}`}>
                <div className="flex items-center gap-2 cursor-pointer">
                  <div className="w-6 h-6 rounded-full overflow-hidden shrink-0">
                    <img src={getAvatarUrl(topic.author?.username || "Anonymous")} alt={topic.author?.username || "Anonymous"} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-sm font-medium">{topic.author?.username ?? "Unknown"}</span>
                </div>
              </Link>
              <span className="text-xs text-muted-foreground">
                {formatTimeAgo(topic.createdAt)}
              </span>
            </div>
            <p className="text-sm font-sans leading-relaxed whitespace-pre-wrap" data-testid="text-topic-content">
              {topic.content}
            </p>
            {topic.imageUrl && (
              <div className="mt-4">
                <img
                  src={topic.imageUrl}
                  alt={topic.title}
                  className="w-full rounded-[10px] object-cover max-h-[400px]"
                  data-testid="img-topic-photo"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center gap-3 mb-4">
          <h2 className="font-semibold text-sm">Replies</h2>
          <span className="text-xs text-muted-foreground border border-border px-2 py-0.5 rounded-[6px] font-mono">{replies?.length ?? 0}</span>
        </div>

        {repliesLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-md" />
            ))}
          </div>
        ) : replyTree.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-muted-foreground">No replies yet. Be the first to respond!</p>
          </div>
        ) : (
          <Card className="mb-5">
            <CardContent className="p-5">
              {replyTree.map((reply, i) => (
                <div key={reply.id}>
                  {i > 0 && <Separator />}
                  <ReplyCard reply={reply as any} onReply={handleReply} />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {isAuthenticated && (
          <Card>
            <CardContent className="p-5">
              {replyingTo && (
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <span className="text-sm text-muted-foreground">Replying to a comment</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(null)}
                  >
                    Cancel
                  </Button>
                </div>
              )}
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write your reply..."
                className="min-h-[100px] mb-4"
                data-testid="input-reply-content"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={() => createReplyMutation.mutate()}
                  disabled={!replyContent.trim() || createReplyMutation.isPending}
                  className="gap-1.5"
                  data-testid="button-submit-reply"
                >
                  <Send className="w-3.5 h-3.5" />
                  {createReplyMutation.isPending ? "Posting..." : "Reply"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
