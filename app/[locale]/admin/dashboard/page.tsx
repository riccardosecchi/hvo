import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { CalendarDays, CheckCircle, Clock, TrendingUp } from "lucide-react";

export default async function DashboardPage() {
  const t = await getTranslations("admin.nav");
  const supabase = await createClient();

  // Fetch stats
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
      color: "var(--hvo-cyan)",
      bgColor: "rgba(0, 229, 255, 0.1)",
    },
    {
      title: "Active Events",
      value: activeEvents,
      icon: CheckCircle,
      color: "#22C55E",
      bgColor: "rgba(34, 197, 94, 0.1)",
    },
    {
      title: "Pending Invites",
      value: pendingInvites,
      icon: Clock,
      color: "var(--hvo-magenta)",
      bgColor: "rgba(233, 30, 140, 0.1)",
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-display tracking-wide text-white mb-2">
          {t("dashboard")}
        </h1>
        <p className="text-[var(--hvo-text-muted)]">
          Overview of your events and admin activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="relative group rounded-2xl bg-[var(--hvo-surface)]/60 backdrop-blur-sm border border-[var(--hvo-border)] p-6 transition-all duration-300 hover:border-[var(--hvo-cyan)]/30"
            >
              {/* Hover glow */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at center, ${stat.bgColor} 0%, transparent 70%)`,
                }}
              />

              <div className="relative">
                {/* Icon */}
                <div
                  className="inline-flex p-3 rounded-xl mb-4"
                  style={{ backgroundColor: stat.bgColor }}
                >
                  <Icon className="h-6 w-6" style={{ color: stat.color }} />
                </div>

                {/* Value */}
                <p className="text-4xl font-display tracking-wide text-white mb-2">
                  {stat.value}
                </p>

                {/* Title */}
                <p className="text-sm text-[var(--hvo-text-muted)] font-medium">
                  {stat.title}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="mt-10">
        <h2 className="text-lg font-display tracking-wide text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <a
            href="events"
            className="flex items-center gap-4 p-4 rounded-xl bg-[var(--hvo-deep)] border border-[var(--hvo-border)] hover:border-[var(--hvo-cyan)]/30 transition-all duration-300 group"
          >
            <div className="p-3 rounded-lg bg-[var(--hvo-cyan)]/10 group-hover:bg-[var(--hvo-cyan)]/20 transition-colors">
              <CalendarDays className="h-5 w-5 text-[var(--hvo-cyan)]" />
            </div>
            <div>
              <p className="font-medium text-white">Manage Events</p>
              <p className="text-sm text-[var(--hvo-text-muted)]">
                Create, edit, or delete events
              </p>
            </div>
            <TrendingUp className="h-5 w-5 text-[var(--hvo-text-muted)] ml-auto group-hover:text-[var(--hvo-cyan)] transition-colors" />
          </a>

          <a
            href="users"
            className="flex items-center gap-4 p-4 rounded-xl bg-[var(--hvo-deep)] border border-[var(--hvo-border)] hover:border-[var(--hvo-magenta)]/30 transition-all duration-300 group"
          >
            <div className="p-3 rounded-lg bg-[var(--hvo-magenta)]/10 group-hover:bg-[var(--hvo-magenta)]/20 transition-colors">
              <Clock className="h-5 w-5 text-[var(--hvo-magenta)]" />
            </div>
            <div>
              <p className="font-medium text-white">Invite Admins</p>
              <p className="text-sm text-[var(--hvo-text-muted)]">
                Manage admin invitations
              </p>
            </div>
            <TrendingUp className="h-5 w-5 text-[var(--hvo-text-muted)] ml-auto group-hover:text-[var(--hvo-magenta)] transition-colors" />
          </a>
        </div>
      </div>
    </div>
  );
}
