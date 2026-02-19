"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { ThemeProvider } from "@/lib/theme-provider";
import { AuthProvider } from "@/lib/auth-context";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Toaster } from "@/components/ui/toaster";
import { usePathname } from "next/navigation";

const authPages = ["/login", "/signup"];

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = authPages.includes(pathname);

  const style = {
    "--sidebar-width": "15rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            {isAuthPage ? (
              <div className="flex h-screen w-full">
                <div className="flex flex-col flex-1 min-w-0">
                  <main className="flex-1 overflow-hidden flex flex-col">
                    {children}
                  </main>
                </div>
              </div>
            ) : (
              <SidebarProvider style={style as React.CSSProperties}>
                <div className="flex h-screen w-full">
                  <AppSidebar />
                  <div className="flex flex-col flex-1 min-w-0">
                    <header className="flex items-center justify-between gap-3 px-5 h-14 border-b sticky top-0 z-50 bg-background">
                      <div className="flex items-center gap-2 flex-wrap">
                        <SidebarTrigger data-testid="button-sidebar-toggle" />
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <ThemeToggle />
                      </div>
                    </header>
                    <main className="flex-1 overflow-hidden flex flex-col">
                      {children}
                    </main>
                  </div>
                </div>
              </SidebarProvider>
            )}
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
