"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { suspendAdmin, reactivateAdmin, removeAdmin, cancelInvite } from "@/lib/supabase/users";
import {
  Copy,
  Check,
  UserPlus,
  Mail,
  Users,
  Clock,
  Loader2,
  Pause,
  Play,
  Trash2,
  X,
  AlertTriangle,
  Shield,
  ShieldOff,
  Link2,
  UserCheck
} from "lucide-react";
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
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    type: "suspend" | "remove" | "cancel";
    id: string;
    email: string;
  } | null>(null);

  // Invites where user hasn't registered yet (waiting for registration)
  const waitingForRegistration = invites.filter((i) => !i.is_confirmed && !i.has_registered);
  // Invites where user registered but master admin hasn't confirmed yet
  const pendingConfirmation = invites.filter((i) => !i.is_confirmed && i.has_registered);
  const activeAdmins = profiles.filter((p) => !p.is_master_admin && !p.is_suspended);
  const suspendedAdmins = profiles.filter((p) => !p.is_master_admin && p.is_suspended);

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
    setActionLoading(inviteId);
    const supabase = createClient();
    await supabase.from("admin_invites").update({ is_confirmed: true }).eq("id", inviteId);
    router.refresh();
    setActionLoading(null);
  };

  const handleSuspend = async (userId: string) => {
    setActionLoading(userId);
    const result = await suspendAdmin(userId);
    if (result.success) {
      router.refresh();
    }
    setActionLoading(null);
    setConfirmDialog(null);
  };

  const handleReactivate = async (userId: string) => {
    setActionLoading(userId);
    const result = await reactivateAdmin(userId);
    if (result.success) {
      router.refresh();
    }
    setActionLoading(null);
  };

  const handleRemove = async (userId: string) => {
    setActionLoading(userId);
    const result = await removeAdmin(userId);
    if (result.success) {
      router.refresh();
    }
    setActionLoading(null);
    setConfirmDialog(null);
  };

  const handleCancelInvite = async (inviteId: string) => {
    setActionLoading(inviteId);
    const result = await cancelInvite(inviteId);
    if (result.success) {
      router.refresh();
    }
    setActionLoading(null);
    setConfirmDialog(null);
  };

  return (
    <div className="space-y-6">
      {/* Confirmation Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surface-1)] border border-white/[0.06] rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-md bg-red-500/10">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="font-semibold text-lg text-white">
                {confirmDialog.type === "suspend" && "Sospendi Admin"}
                {confirmDialog.type === "remove" && "Rimuovi Admin"}
                {confirmDialog.type === "cancel" && "Annulla Invito"}
              </h3>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              {confirmDialog.type === "suspend" && (
                <>Sei sicuro di voler sospendere <strong className="text-white">{confirmDialog.email}</strong>? L&apos;utente non potrà più accedere al pannello admin.</>
              )}
              {confirmDialog.type === "remove" && (
                <>Sei sicuro di voler rimuovere definitivamente <strong className="text-white">{confirmDialog.email}</strong>? Questa azione non può essere annullata.</>
              )}
              {confirmDialog.type === "cancel" && (
                <>Sei sicuro di voler annullare l&apos;invito per <strong className="text-white">{confirmDialog.email}</strong>? Il link di registrazione non sarà più valido.</>
              )}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-white transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={() => {
                  if (confirmDialog.type === "suspend") handleSuspend(confirmDialog.id);
                  else if (confirmDialog.type === "remove") handleRemove(confirmDialog.id);
                  else if (confirmDialog.type === "cancel") handleCancelInvite(confirmDialog.id);
                }}
                disabled={actionLoading === confirmDialog.id}
                className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading === confirmDialog.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Conferma"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
                  className={`h-10 px-4 rounded-md border transition-colors flex items-center gap-2 ${copied
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

      {/* Invites waiting for registration (link sent but user hasn't registered yet) */}
      {isMasterAdmin && waitingForRegistration.length > 0 && (
        <div className="bg-[var(--surface-1)] border border-white/[0.06] rounded-lg overflow-hidden">
          <div className="p-4 border-b border-white/[0.06] flex items-center gap-3">
            <div className="p-2 rounded-md bg-blue-500/10">
              <Link2 className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="font-semibold text-lg text-white">Link Inviati</h2>
            <span className="ml-auto px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium">
              {waitingForRegistration.length}
            </span>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {waitingForRegistration.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between p-4"
              >
                <div>
                  <span className="text-sm text-white">{invite.email}</span>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">In attesa di registrazione</p>
                </div>
                <button
                  onClick={() => setConfirmDialog({ type: "cancel", id: invite.id, email: invite.email })}
                  className="p-2 text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                  title="Annulla invito"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users registered but pending confirmation */}
      {isMasterAdmin && pendingConfirmation.length > 0 && (
        <div className="bg-[var(--surface-1)] border border-white/[0.06] rounded-lg overflow-hidden">
          <div className="p-4 border-b border-white/[0.06] flex items-center gap-3">
            <div className="p-2 rounded-md bg-amber-500/10">
              <UserCheck className="w-5 h-5 text-amber-400" />
            </div>
            <h2 className="font-semibold text-lg text-white">In Attesa Conferma</h2>
            <span className="ml-auto px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium">
              {pendingConfirmation.length}
            </span>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {pendingConfirmation.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between p-4"
              >
                <div>
                  <span className="text-sm text-white">{invite.email}</span>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Registrato {invite.registered_at && new Date(invite.registered_at).toLocaleDateString("it-IT")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => confirmUser(invite.id)}
                    disabled={actionLoading === invite.id}
                    className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-md hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {actionLoading === invite.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      t("confirmUser")
                    )}
                  </button>
                  <button
                    onClick={() => setConfirmDialog({ type: "cancel", id: invite.id, email: invite.email })}
                    className="p-2 text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                    title="Rimuovi"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Admins */}
      <div className="bg-[var(--surface-1)] border border-white/[0.06] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-white/[0.06] flex items-center gap-3">
          <div className="p-2 rounded-md bg-green-500/10">
            <Users className="w-5 h-5 text-green-400" />
          </div>
          <h2 className="font-semibold text-lg text-white">{t("confirmed")}</h2>
          <span className="ml-auto px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">
            {activeAdmins.length}
          </span>
        </div>
        <div className="p-4">
          {activeAdmins.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-4">
              No other admins yet
            </p>
          ) : (
            <div className="space-y-2">
              {activeAdmins.map((profile) => (
                <div
                  key={profile.id}
                  className="flex items-center gap-3 p-3 bg-[var(--surface-2)] rounded-md"
                >
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <span className="text-green-400 text-sm font-medium">
                      {profile.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <span className="text-sm text-white">{profile.email}</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Shield className="w-3 h-3 text-green-400" />
                      <span className="text-xs text-green-400">Attivo</span>
                    </div>
                  </div>
                  {isMasterAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setConfirmDialog({ type: "suspend", id: profile.id, email: profile.email })}
                        className="p-2 text-[var(--text-muted)] hover:text-amber-400 hover:bg-amber-500/10 rounded-md transition-colors"
                        title="Sospendi"
                      >
                        <Pause className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDialog({ type: "remove", id: profile.id, email: profile.email })}
                        className="p-2 text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                        title="Rimuovi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Suspended Admins */}
      {isMasterAdmin && suspendedAdmins.length > 0 && (
        <div className="bg-[var(--surface-1)] border border-white/[0.06] rounded-lg overflow-hidden">
          <div className="p-4 border-b border-white/[0.06] flex items-center gap-3">
            <div className="p-2 rounded-md bg-red-500/10">
              <ShieldOff className="w-5 h-5 text-red-400" />
            </div>
            <h2 className="font-semibold text-lg text-white">Admin Sospesi</h2>
            <span className="ml-auto px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-xs font-medium">
              {suspendedAdmins.length}
            </span>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {suspendedAdmins.map((profile) => (
                <div
                  key={profile.id}
                  className="flex items-center gap-3 p-3 bg-[var(--surface-2)] rounded-md opacity-75"
                >
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                    <span className="text-red-400 text-sm font-medium">
                      {profile.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <span className="text-sm text-white">{profile.email}</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <ShieldOff className="w-3 h-3 text-red-400" />
                      <span className="text-xs text-red-400">Sospeso</span>
                      {profile.suspended_at && (
                        <span className="text-xs text-[var(--text-muted)] ml-2">
                          dal {new Date(profile.suspended_at).toLocaleDateString("it-IT")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleReactivate(profile.id)}
                      disabled={actionLoading === profile.id}
                      className="p-2 text-[var(--text-muted)] hover:text-green-400 hover:bg-green-500/10 rounded-md transition-colors disabled:opacity-50"
                      title="Riattiva"
                    >
                      {actionLoading === profile.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => setConfirmDialog({ type: "remove", id: profile.id, email: profile.email })}
                      className="p-2 text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                      title="Rimuovi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
