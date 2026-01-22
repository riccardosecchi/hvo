"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import Image from "next/image";

interface SidebarProps {
  locale: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

function NavContent({
  navItems,
  pathname,
  onLinkClick,
  onLogout,
  logoutLabel,
}: {
  navItems: NavItem[];
  pathname: string;
  onLinkClick: () => void;
  onLogout: () => void;
  logoutLabel: string;
}) {
  return (
    <>
      <div className="p-4 border-b border-border/50">
        <Image
          src="/logos/04_HVO.jpg"
          alt="HVO"
          width={100}
          height={40}
          className="h-8 w-auto"
        />
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onLinkClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border/50">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={onLogout}
        >
          <LogOut className="h-5 w-5 mr-3" />
          {logoutLabel}
        </Button>
      </div>
    </>
  );
}

export function Sidebar({ locale }: SidebarProps) {
  const t = useTranslations("admin.nav");
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: NavItem[] = [
    { href: `/${locale}/admin/dashboard`, label: t("dashboard"), icon: LayoutDashboard },
    { href: `/${locale}/admin/events`, label: t("events"), icon: CalendarDays },
    { href: `/${locale}/admin/users`, label: t("users"), icon: Users },
    { href: `/${locale}/admin/profile`, label: t("profile"), icon: User },
  ];

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/admin/login`);
    router.refresh();
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border/50 transform transition-transform md:hidden flex flex-col",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <NavContent
          navItems={navItems}
          pathname={pathname}
          onLinkClick={closeMobile}
          onLogout={handleLogout}
          logoutLabel={t("logout")}
        />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 bg-card border-r border-border/50 flex-col">
        <NavContent
          navItems={navItems}
          pathname={pathname}
          onLinkClick={closeMobile}
          onLogout={handleLogout}
          logoutLabel={t("logout")}
        />
      </aside>
    </>
  );
}
