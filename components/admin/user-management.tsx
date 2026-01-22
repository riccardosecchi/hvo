"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Copy, Check, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminInvite, Profile } from "@/lib/database.types";

interface UserManagementProps {
  invites: AdminInvite[];
  profiles: Profile[];
  isMasterAdmin: boolean;
  locale: string;
}

export function UserManagement({ invites, profiles, isMasterAdmin, locale }: UserManagementProps) {
  const t = useTranslations("admin.users");
  const tCommon = useTranslations("common");
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
    <div className="space-y-8">
      {/* Invite Section */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            {t("invite")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="email" className="sr-only">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-input border-border"
              />
            </div>
            <Button
              onClick={generateInviteLink}
              disabled={!email || loading}
              className="bg-primary text-primary-foreground"
            >
              {loading ? "..." : t("generateLink")}
            </Button>
          </div>

          {generatedLink && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Registration link:</p>
              <div className="flex gap-2">
                <Input
                  value={generatedLink}
                  readOnly
                  className="bg-input border-border text-xs"
                />
                <Button variant="outline" size="icon" onClick={copyLink}>
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              {copied && (
                <p className="text-xs text-green-500 mt-1">{t("linkCopied")}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invites */}
      {isMasterAdmin && pendingInvites.length > 0 && (
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>{t("pending")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <span className="text-sm">{invite.email}</span>
                  <Button
                    size="sm"
                    onClick={() => confirmUser(invite.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {t("confirmUser")}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmed Admins */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle>{t("confirmed")}</CardTitle>
        </CardHeader>
        <CardContent>
          {confirmedProfiles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No other admins yet</p>
          ) : (
            <div className="space-y-2">
              {confirmedProfiles.map((profile) => (
                <div
                  key={profile.id}
                  className="p-3 bg-muted/30 rounded-lg"
                >
                  <span className="text-sm">{profile.email}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
