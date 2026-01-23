"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Copy, Check, UserPlus, Mail, Users, Clock, Loader2 } from "lucide-react";
import type { AdminInvite, Profile } from "@/lib/database.types";

interface UserManagementProps {
  invites: AdminInvite[];
  profiles: Profile[];
  isMasterAdmin: boolean;
  locale: string;
}

export function UserManagement({ invites, profiles, isMasterAdmin, locale }: UserManagementProps) {
  const t = useTranslations("admin.users");
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const pendingInvites = invites.filter((i) => !i.is_confirmed);
  const confirmedProfiles = profiles.filter((p) => !p.is_master_admin);

  const generateInviteLink = async () => {
    if (!email) return;
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const token = crypto.randomUUID();

    const { error } = await supabase.from("admin_invites").insert({
      email,
      invitation_token: token,
      invited_by: user?.id,
    });

    if (!error) {
      const link = `${window.location.origin}/${locale}/admin/register?token=${token}`;
      setGeneratedLink(link);
      setEmail("");
      router.refresh();
    }

    setLoading(false);
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const confirmUser = async (inviteId: string) => {
    const supabase = createClient();
    await supabase.from("admin_invites").update({ is_confirmed: true }).eq("id", inviteId);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Invite Section */}
      <div className="bg-[var(--surface-1)] border border-white/[0.06] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-white/[0.06] flex items-center gap-3">
          <div className="p-2 rounded-md bg-[var(--accent)]/10">
            <UserPlus className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <h2 className="font-semibold text-lg text-white">{t("invite")}</h2>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 pl-12 pr-4 bg-[var(--surface-2)] border border-white/[0.06] rounded-md text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>
            <button
              onClick={generateInviteLink}
              disabled={!email || loading}
              className="h-11 px-5 bg-[var(--accent)] text-white font-medium text-sm tracking-wide uppercase rounded-md hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("generateLink")}
            </button>
          </div>

          {generatedLink && (
            <div className="p-4 bg-[var(--surface-2)] rounded-md">
              <p className="text-xs text-[var(--text-muted)] mb-2">Registration link:</p>
              <div className="flex gap-2">
                <input
                  value={generatedLink}
                  readOnly
                  className="flex-1 h-10 px-3 bg-[var(--surface-1)] border border-white/[0.06] rounded-md text-xs text-[var(--text-secondary)] focus:outline-none"
                />
                <button
                  onClick={copyLink}
                  className={`h-10 px-4 rounded-md border transition-colors flex items-center gap-2 ${
                    copied
                      ? "bg-green-500/10 border-green-500/30 text-green-400"
                      : "bg-[var(--surface-1)] border-white/[0.06] text-[var(--text-muted)] hover:text-white"
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              {copied && (
                <p className="text-xs text-green-400 mt-2">{t("linkCopied")}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pending Invites */}
      {isMasterAdmin && pendingInvites.length > 0 && (
        <div className="bg-[var(--surface-1)] border border-white/[0.06] rounded-lg overflow-hidden">
          <div className="p-4 border-b border-white/[0.06] flex items-center gap-3">
            <div className="p-2 rounded-md bg-amber-500/10">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <h2 className="font-semibold text-lg text-white">{t("pending")}</h2>
            <span className="ml-auto px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium">
              {pendingInvites.length}
            </span>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {pendingInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between p-4"
              >
                <span className="text-sm text-white">{invite.email}</span>
                <button
                  onClick={() => confirmUser(invite.id)}
                  className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-md hover:bg-green-600 transition-colors"
                >
                  {t("confirmUser")}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmed Admins */}
      <div className="bg-[var(--surface-1)] border border-white/[0.06] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-white/[0.06] flex items-center gap-3">
          <div className="p-2 rounded-md bg-green-500/10">
            <Users className="w-5 h-5 text-green-400" />
          </div>
          <h2 className="font-semibold text-lg text-white">{t("confirmed")}</h2>
          <span className="ml-auto px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">
            {confirmedProfiles.length}
          </span>
        </div>
        <div className="p-4">
          {confirmedProfiles.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-4">
              No other admins yet
            </p>
          ) : (
            <div className="space-y-2">
              {confirmedProfiles.map((profile) => (
                <div
                  key={profile.id}
                  className="flex items-center gap-3 p-3 bg-[var(--surface-2)] rounded-md"
                >
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <span className="text-green-400 text-sm font-medium">
                      {profile.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm text-white">{profile.email}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
