"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Search, Users, MessageSquare, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { User, ForumTopic } from "@/shared/schema";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  return `${local[0]}***@${domain}`;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");

  const { data: results, isLoading } = useQuery<{
    members: User[];
    topics: (ForumTopic & { author: User })[];
  }>({
    queryKey: ["/api/search", `?q=${encodeURIComponent(query)}`],
    enabled: query.length >= 2,
  });

  const memberCount = results?.members?.length ?? 0;
  const topicCount = results?.topics?.length ?? 0;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto p-5 sm:p-8">
        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search contributors, topics, or discussions..."
            className="pl-10"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            data-testid="input-global-search"
          />
        </div>

        {query.length < 2 ? (
          <div className="text-center py-20">
            <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-display font-semibold mb-1">Search the community</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Find contributors by name or skills. Search forum topics and discussions.
            </p>
          </div>
        ) : isLoading ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">Searching...</p>
          </div>
        ) : (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="mb-5">
              <TabsTrigger value="all" data-testid="tab-all">
                All ({memberCount + topicCount})
              </TabsTrigger>
              <TabsTrigger value="members" data-testid="tab-members">
                Contributors ({memberCount})
              </TabsTrigger>
              <TabsTrigger value="topics" data-testid="tab-topics">
                Topics ({topicCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              {memberCount === 0 && topicCount === 0 && (
                <div className="text-center py-12">
                  <p className="text-sm text-muted-foreground">No results found for "{query}"</p>
                </div>
              )}
              {memberCount > 0 && (
                <Card className="mb-5">
                  <CardContent className="p-4">
                    <h3 className="text-xs font-display font-semibold uppercase tracking-widest text-muted-foreground px-2 mb-2">Contributors</h3>
                    {results?.members?.slice(0, 5).map((member, i) => (
                      <div key={member.id}>
                        {i > 0 && <Separator />}
                        <Link href={`/contributors/${member.id}`}>
                          <div className="flex items-center gap-3 p-2.5 rounded-md hover-elevate cursor-pointer" data-testid={`search-member-${member.id}`}>
                            <Avatar className="w-8 h-8">
                              {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt={member.username} />}
                              <AvatarFallback className="text-xs">
                                {member.username.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm">{member.username}</p>
                              <p className="text-xs text-muted-foreground font-mono">
                                {maskEmail(member.email)}
                              </p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                          </div>
                        </Link>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
              {topicCount > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-xs font-display font-semibold uppercase tracking-widest text-muted-foreground px-2 mb-2">Topics</h3>
                    {results?.topics?.slice(0, 5).map((topic, i) => (
                      <div key={topic.id}>
                        {i > 0 && <Separator />}
                        <Link href={`/forum/${topic.categoryId}/${topic.id}`}>
                          <div className="flex items-center gap-3 p-2.5 rounded-md hover-elevate cursor-pointer" data-testid={`search-topic-${topic.id}`}>
                            <div className="w-8 h-8 rounded-md border border-border flex items-center justify-center shrink-0">
                              <MessageSquare className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-display font-semibold text-sm">{topic.title}</p>
                              <p className="text-xs text-muted-foreground">
                                by {topic.author?.username ?? "Unknown"} · <span className="font-mono">{topic.replyCount ?? 0}</span> replies
                              </p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                          </div>
                        </Link>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="members">
              {memberCount === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-muted-foreground">No contributors found for "{query}"</p>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-4">
                    {results?.members?.map((member, i) => (
                      <div key={member.id}>
                        {i > 0 && <Separator />}
                        <Link href={`/contributors/${member.id}`}>
                          <div className="flex items-center gap-3 p-2.5 rounded-md hover-elevate cursor-pointer">
                            <Avatar className="w-8 h-8">
                              {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt={member.username} />}
                              <AvatarFallback className="text-xs">
                                {member.username.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-display font-semibold text-sm">{member.username}</p>
                              <p className="text-xs text-muted-foreground font-mono">
                                {maskEmail(member.email)}
                              </p>
                            </div>
                            <div className="flex gap-1.5 shrink-0 flex-wrap">
                              {member.skillTags?.slice(0, 2).map((tag) => (
                                <span key={tag} className="text-xs text-muted-foreground border border-border px-2 py-0.5 rounded-[6px]">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="topics">
              {topicCount === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-muted-foreground">No topics found for "{query}"</p>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-4">
                    {results?.topics?.map((topic, i) => (
                      <div key={topic.id}>
                        {i > 0 && <Separator />}
                        <Link href={`/forum/${topic.categoryId}/${topic.id}`}>
                          <div className="p-2.5 rounded-md hover-elevate cursor-pointer">
                            <p className="font-display font-semibold text-sm">{topic.title}</p>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{topic.content}</p>
                            <p className="text-xs text-muted-foreground mt-1.5">
                              by {topic.author?.username ?? "Unknown"} · <span className="font-mono">{topic.replyCount ?? 0}</span> replies
                            </p>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
