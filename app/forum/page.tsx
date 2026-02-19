"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { MessageSquare, Plus, Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useAuth } from "@/lib/auth-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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

function CategoryRow({
  category,
  isAdmin,
  onEdit,
  onDelete,
}: {
  category: ForumCategory;
  isAdmin: boolean;
  onEdit: (cat: ForumCategory) => void;
  onDelete: (cat: ForumCategory) => void;
}) {
  const topicCount = category.topicCount ?? 0;
  const isActive = topicCount >= 3;

  return (
    <div
      className="flex items-center gap-4 py-4 px-4 border-b border-border last:border-0"
      data-testid={`card-category-${category.id}`}
    >
      <Link href={`/forum/${category.id}`} className="flex-1 min-w-0 hover-elevate cursor-pointer">
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
      </Link>

      <div className="flex items-center gap-4 shrink-0">
        <ContributorAvatars name={category.name} />
        <span
          className="font-mono text-sm text-muted-foreground"
          data-testid={`text-topic-count-${category.id}`}
        >
          {topicCount}
        </span>
        {isAdmin && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onEdit(category)}
              data-testid={`button-edit-category-${category.id}`}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => onDelete(category)}
              data-testid={`button-delete-category-${category.id}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
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
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";

  const { data: categories, isLoading } = useQuery<ForumCategory[]>({
    queryKey: ["/api/forum/categories"],
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ForumCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ForumCategory | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("MessageSquare");

  const openCreate = () => {
    setEditingCategory(null);
    setName("");
    setSlug("");
    setDescription("");
    setIcon("MessageSquare");
    setDialogOpen(true);
  };

  const openEdit = (cat: ForumCategory) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || "");
    setIcon(cat.icon || "MessageSquare");
    setDialogOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/forum/categories", { name, slug, description, icon });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create category");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forum/categories"] });
      setDialogOpen(false);
      toast({ title: "Category created" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/forum/categories/${editingCategory!.id}`, { name, slug, description, icon });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update category");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forum/categories"] });
      setDialogOpen(false);
      toast({ title: "Category updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/forum/categories/${id}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete category");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forum/categories"] });
      setDeleteTarget(null);
      toast({ title: "Category deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto p-8">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
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
          {isAdmin && (
            <Button onClick={openCreate} className="gap-1.5" data-testid="button-add-category">
              <Plus className="w-4 h-4" />
              Add Category
            </Button>
          )}
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
              <CategoryRow
                key={cat.id}
                category={cat}
                isAdmin={isAdmin}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
              />
            ))}
          </Card>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "New Category"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div>
              <Label className="mb-1.5 block">Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="General Discussion" required />
            </div>
            <div>
              <Label className="mb-1.5 block">Slug</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="general-discussion"
                required
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this category about?" rows={2} />
            </div>
            <div>
              <Label className="mb-1.5 block">Icon</Label>
              <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="MessageSquare" />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingCategory ? "Save Changes" : "Create Category"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{deleteTarget?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this category and all its topics and replies. This action cannot be undone.
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
