"use client";

import dynamic from "next/dynamic";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme-provider";

function ThemeToggleInner() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={toggleTheme}
      data-testid="button-theme-toggle"
    >
      {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </Button>
  );
}

export const ThemeToggle = dynamic(() => Promise.resolve(ThemeToggleInner), {
  ssr: false,
  loading: () => (
    <Button size="icon" variant="ghost" data-testid="button-theme-toggle">
      <Moon className="w-4 h-4" />
    </Button>
  ),
});
