import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { CalendarDays, CheckCircle, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const t = await getTranslations("admin.nav");
  const supabase = await createClient();

  const [eventsResult, activeEventsResult, invitesResult] = await Promise.all([
    supabase.from("events").select("id", { count: "exact" }),
    supabase.from("events").select("id", { count: "exact" }).eq("is_active", true),
    supabase.from("admin_invites").select("id", { count: "exact" }).eq("is_confirmed", false),
  ]);

  const totalEvents = eventsResult.count || 0;
  const activeEvents = activeEventsResult.count || 0;
  const pendingInvites = invitesResult.count || 0;

  const stats = [
    {
      title: "Total Events",
      value: totalEvents,
      icon: CalendarDays,
    },
    {
      title: "Active Events",
      value: activeEvents,
      icon: CheckCircle,
    },
    {
      title: "Pending Invites",
      value: pendingInvites,
      icon: Clock,
    },
  ];

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">
          {t("dashboard")}
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Overview of your events and activity
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="p-5 rounded-lg bg-[var(--surface-1)] border border-white/10"
            >
              <div className="flex items-center gap-3 mb-3">
                <Icon className="w-4 h-4 text-[var(--text-muted)]" />
                <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
                  {stat.title}
                </span>
              </div>
              <p className="text-3xl font-semibold text-white tabular-nums">
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-4">
          Quick Actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="events"
            className="flex items-center justify-between p-4 rounded-lg bg-[var(--surface-1)] border border-white/10 hover:border-[var(--accent)]/30 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <CalendarDays className="w-4 h-4 text-[var(--accent)]" />
              <span className="text-sm text-white">Manage Events</span>
            </div>
            <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" />
          </Link>

          <Link
            href="users"
            className="flex items-center justify-between p-4 rounded-lg bg-[var(--surface-1)] border border-white/10 hover:border-[var(--accent)]/30 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-[var(--accent)]" />
              <span className="text-sm text-white">Invite Admins</span>
            </div>
            <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}
