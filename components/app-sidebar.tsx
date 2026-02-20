"use client";

import { Home, Users, MessageSquare, Activity, Search, Trophy, LayoutDashboard, Target, LogOut, LogIn } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth-context";
import { ContributorAvatar } from "@/components/contributor-avatar";

const mainNav = [
  { title: "Home", url: "/", icon: Home },
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Leaderboard", url: "/leaderboard", icon: Trophy },
  { title: "Quests", url: "/quests", icon: Target },
];

const communityNav = [
  { title: "Contributors", url: "/contributors", icon: Users },
  { title: "Forum", url: "/forum", icon: MessageSquare },
  { title: "Activity", url: "/activity", icon: Activity },
  { title: "Search", url: "/search", icon: Search },
];

const tierLabels: Record<string, string> = {
  contributor: "Contributor",
  ambassador: "Ambassador",
  fellow: "Fellow",
};

const tierThresholds: Record<string, { next: string; points: number }> = {
  contributor: { next: "Ambassador", points: 500 },
  ambassador: { next: "Fellow", points: 2000 },
};

export function AppSidebar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const { setOpenMobile, isMobile } = useSidebar();

  const isActive = (url: string) => {
    if (url === "/") return pathname === "/";
    return pathname === url || pathname.startsWith(url + "/");
  };

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const progressInfo = user && tierThresholds[user.tier]
    ? {
        remaining: Math.max(0, tierThresholds[user.tier].points - user.totalPoints),
        nextTier: tierThresholds[user.tier].next,
      }
    : null;

  return (
    <Sidebar>
      <SidebarHeader className="p-4 pb-2">
        <Link href="/" onClick={handleNavClick}>
          <div className="flex items-center gap-2 cursor-pointer" data-testid="link-home">
            <span className="font-display font-bold text-sm uppercase tracking-wider">Insidr</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 mb-1 text-[10px] uppercase tracking-[0.08em] text-muted-foreground/60 font-semibold">
            Program
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} size="sm">
                    <Link href={item.url} onClick={handleNavClick} data-testid={`link-nav-${item.title.toLowerCase()}`}>
                      <item.icon className={`w-3.5 h-3.5 ${isActive(item.url) ? "text-primary" : "text-muted-foreground"}`} />
                      <span className={`text-[13px] ${isActive(item.url) ? "font-display font-medium" : "font-sans"}`}>
                        {item.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-2">
          <SidebarGroupLabel className="px-2 mb-1 text-[10px] uppercase tracking-[0.08em] text-muted-foreground/60 font-semibold">
            Community
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {communityNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} size="sm">
                    <Link href={item.url} onClick={handleNavClick} data-testid={`link-nav-${item.title.toLowerCase()}`}>
                      <item.icon className={`w-3.5 h-3.5 ${isActive(item.url) ? "text-primary" : "text-muted-foreground"}`} />
                      <span className={`text-[13px] ${isActive(item.url) ? "font-display font-medium" : "font-sans"}`}>
                        {item.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAuthenticated && user && (
          <>
            <SidebarSeparator className="mx-2" />
            <div className="px-4 py-3">
              <p className="text-xs uppercase tracking-[0.05em] text-muted-foreground mb-2">
                {tierLabels[user.tier] || user.tier}
              </p>
              <p className="font-mono text-sm font-medium" data-testid="text-sidebar-points">
                {user.totalPoints.toLocaleString()} pts
              </p>
              {progressInfo && progressInfo.remaining > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {progressInfo.remaining.toLocaleString()} pts to {progressInfo.nextTier}
                </p>
              )}
            </div>
          </>
        )}
      </SidebarContent>
      <SidebarFooter className="p-4">
        {isAuthenticated && user ? (
          <>
            <Link href={`/contributors/${user.id}`} onClick={handleNavClick}>
              <div className="flex items-center gap-3 p-2.5 rounded-md hover-elevate cursor-pointer flex-wrap" data-testid="link-sidebar-profile">
                <ContributorAvatar user={user} size="md" isActive />
                <div className="min-w-0 flex-1">
                  <p className={`truncate ${user.tier === "fellow" ? "font-display font-semibold text-sm" : "font-sans text-sm"}`}>
                    {user.username}
                  </p>
                  <p className="text-xs text-muted-foreground" data-testid="text-user-points">
                    {tierLabels[user.tier] || user.tier}
                  </p>
                </div>
              </div>
            </Link>
            <button
              onClick={() => { logout(); handleNavClick(); }}
              className="flex items-center gap-2 w-full p-2.5 rounded-md text-sm text-muted-foreground hover:text-destructive hover:bg-muted transition-colors cursor-pointer"
              data-testid="button-sidebar-logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </>
        ) : (
          <Link href="/login" onClick={handleNavClick}>
            <div className="flex items-center gap-2 p-2.5 rounded-md hover-elevate cursor-pointer text-sm" data-testid="link-sidebar-login">
              <LogIn className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Login</span>
            </div>
          </Link>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
