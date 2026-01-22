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
import { cn } from "@/lib/utils";
import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

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
      {/* Logo */}
      <div className="p-6 border-b border-[var(--hvo-border)]">
        <Link href="/" className="block">
          <Image
            src="/logos/04_HVO.jpg"
            alt="HVO"
            width={48}
            height={48}
            className="h-12 w-12 object-cover rounded-lg"
            style={{
              boxShadow: "0 0 20px rgba(0, 229, 255, 0.2)",
            }}
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onLinkClick}
              className={cn(
                "relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300",
                isActive
                  ? "text-[var(--hvo-cyan)]"
                  : "text-[var(--hvo-text-muted)] hover:text-[var(--hvo-text-secondary)]"
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 rounded-xl bg-[var(--hvo-cyan)]/10 border border-[var(--hvo-cyan)]/20"
                  style={{
                    boxShadow: "0 0 20px rgba(0, 229, 255, 0.1)",
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <Icon className={cn("h-5 w-5 relative z-10", isActive && "drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]")} />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-[var(--hvo-border)]">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-[var(--hvo-text-muted)] hover:text-[var(--hvo-magenta)] hover:bg-[var(--hvo-magenta)]/10 transition-all duration-300"
        >
          <LogOut className="h-5 w-5" />
          {logoutLabel}
        </button>
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
      <button
        className="fixed top-4 left-4 z-50 p-3 rounded-xl bg-[var(--hvo-surface)] border border-[var(--hvo-border)] text-[var(--hvo-text-secondary)] md:hidden hover:border-[var(--hvo-cyan)]/30 transition-colors"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[var(--hvo-void)]/80 backdrop-blur-sm z-40 md:hidden"
            onClick={closeMobile}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 z-50 w-72 bg-[var(--hvo-deep)] border-r border-[var(--hvo-border)] flex flex-col md:hidden"
          >
            <NavContent
              navItems={navItems}
              pathname={pathname}
              onLinkClick={closeMobile}
              onLogout={handleLogout}
              logoutLabel={t("logout")}
            />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-72 bg-[var(--hvo-deep)]/80 backdrop-blur-xl border-r border-[var(--hvo-border)] flex-col">
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
