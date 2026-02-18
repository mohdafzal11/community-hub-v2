"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { ForumCategory } from "@/shared/schema";

function ContributorAvatars({ name }: { name: string }) {
  const letters = name.replace(/[^a-zA-Z]/g, "").toUpperCase();
  const fallbacks = [
    letters.slice(0, 2),
    letters.slice(1, 3) || letters.slice(0, 1),
    letters.length > 2 ? letters.slice(2, 4) || letters.slice(0, 2) : letters.slice(0, 1),
  ];

  return (
    <div className="flex items-center">
      {fallbacks.map((fb, i) => (
        <Avatar
          key={i}
          className={`w-5 h-5 border-2 border-card bg-muted ${i > 0 ? "-ml-1.5" : ""}`}
        >
          <AvatarFallback className="text-[8px] font-medium text-muted-foreground bg-muted">
            {fb}
          </AvatarFallback>
        </Avatar>
      ))}
    </div>
  );
}

function CategoryRow({ category }: { category: ForumCategory }) {
  const topicCount = category.topicCount ?? 0;
  const isActive = topicCount >= 3;

  return (
    <Link href={`/forum/${category.id}`}>
      <div
        className="flex items-center gap-4 py-4 px-4 border-b border-border last:border-0 hover-elevate cursor-pointer"
        data-testid={`card-category-${category.id}`}
      >
        <div className="flex-1 min-w-0">
          <h3
            className={`font-display font-medium text-base ${isActive ? "text-foreground" : "text-muted-foreground"}`}
            data-testid={`text-category-name-${category.id}`}
          >
            {category.name}
          </h3>
          {category.description && (
            <p className="font-sans text-sm text-muted-foreground mt-1 line-clamp-1">
              {category.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <ContributorAvatars name={category.name} />
          <span
            className="font-mono text-sm text-muted-foreground"
            data-testid={`text-topic-count-${category.id}`}
          >
            {topicCount}
          </span>
        </div>
      </div>
    </Link>
  );
}

function CategorySkeleton() {
  return (
    <div className="flex items-center gap-4 py-4 px-4 border-b border-border last:border-0">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3.5 w-52" />
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center">
          <Skeleton className="w-5 h-5 rounded-full" />
          <Skeleton className="w-5 h-5 rounded-full -ml-1.5" />
          <Skeleton className="w-5 h-5 rounded-full -ml-1.5" />
        </div>
        <Skeleton className="h-4 w-6" />
      </div>
    </div>
  );
}

export default function Forum() {
  const { data: categories, isLoading } = useQuery<ForumCategory[]>({
    queryKey: ["/api/forum/categories"],
  });

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto p-8">
        <div className="mb-8">
          <h1
            className="font-display font-semibold text-2xl page-title-fade"
            data-testid="text-forum-title"
          >
            Forum
          </h1>
          <p className="font-sans text-sm text-muted-foreground mt-1">
            Browse conversations and join the community
          </p>
        </div>

        {isLoading ? (
          <Card className="rounded-[10px]">
            {Array.from({ length: 4 }).map((_, i) => (
              <CategorySkeleton key={i} />
            ))}
          </Card>
        ) : categories?.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3
              className="font-display font-semibold mb-1"
              data-testid="text-empty-title"
            >
              No categories yet
            </h3>
            <p className="font-sans text-sm text-muted-foreground">
              Forum categories will appear here.
            </p>
          </div>
        ) : (
          <Card className="rounded-[10px] overflow-visible">
            {categories?.map((cat) => (
              <CategoryRow key={cat.id} category={cat} />
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
