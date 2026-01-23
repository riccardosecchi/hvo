import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { UserManagement } from "@/components/admin/user-management";

interface UsersPageProps {
  params: Promise<{ locale: string }>;
}

export default async function UsersPage({ params }: UsersPageProps) {
  const { locale } = await params;
  const t = await getTranslations("admin.users");
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const [invitesResult, profilesResult, currentProfileResult] = await Promise.all([
    supabase.from("admin_invites").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("*"),
    supabase.from("profiles").select("is_master_admin").eq("id", user?.id || "").single(),
  ]);

  const isMasterAdmin = currentProfileResult.data?.is_master_admin || false;

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white mb-1">
          {t("title")}
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Invite and manage admin users
        </p>
      </div>
      <UserManagement
        invites={invitesResult.data || []}
        profiles={profilesResult.data || []}
        isMasterAdmin={isMasterAdmin}
        locale={locale}
      />
    </div>
  );
}
