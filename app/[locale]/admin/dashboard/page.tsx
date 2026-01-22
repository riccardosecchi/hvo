import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { CalendarDays, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      color: "text-primary",
    },
    {
      title: "Active Events",
      value: activeEvents,
      icon: CheckCircle,
      color: "text-green-500",
    },
    {
      title: "Pending Invites",
      value: pendingInvites,
      icon: Clock,
      color: "text-yellow-500",
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">{t("dashboard")}</h1>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="bg-card/50 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
