import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { ProfileForm } from "@/components/admin/profile-form";

export default async function ProfilePage() {
  const t = await getTranslations("admin.profile");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>
      <ProfileForm email={user?.email || ""} />
    </div>
  );
}
