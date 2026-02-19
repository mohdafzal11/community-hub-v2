"use client";

import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

export function AuthButton() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading || isAuthenticated) {
    return null;
  }

  return (
    <Link href="/login">
      <Button data-testid="button-login" className="gap-2">
        <LogIn className="w-4 h-4" />
        Login
      </Button>
    </Link>
  );
}
