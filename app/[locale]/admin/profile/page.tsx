import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { ProfileForm } from "@/components/admin/profile-form";

export default async function ProfilePage() {
  const t = await getTranslations("admin.profile");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white mb-1">
          {t("title")}
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Manage your account settings
        </p>
      </div>
      <ProfileForm email={user?.email || ""} />
    </div>
  );
}
