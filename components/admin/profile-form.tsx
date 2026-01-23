"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Mail, Lock, Key, CheckCircle, AlertCircle } from "lucide-react";
import { CosmicInput } from "@/components/ui/cosmic-input";
import { CosmicButton } from "@/components/ui/cosmic-button";

interface ProfileFormProps {
  email: string;
}

export function ProfileForm({ email }: ProfileFormProps) {
  const t = useTranslations("admin.profile");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    // First verify current password by signing in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });

    if (signInError) {
      setError("Current password is incorrect");
      setLoading(false);
      return;
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setLoading(false);
  };

  return (
    <div className="space-y-8 max-w-lg">
      {/* Email display card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden"
      >
        <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-br from-[var(--hvo-cyan)]/20 to-transparent">
          <div className="absolute inset-[1px] rounded-2xl bg-[var(--hvo-surface)]" />
        </div>
        <div className="relative p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-[var(--hvo-cyan)]/10">
              <Mail className="h-5 w-5 text-[var(--hvo-cyan)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--hvo-text-muted)] mb-1">Email Address</p>
              <p className="text-white font-medium">{email}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Password change card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative rounded-2xl overflow-hidden"
      >
        <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-br from-[var(--hvo-magenta)]/20 via-transparent to-[var(--hvo-cyan)]/20">
          <div className="absolute inset-[1px] rounded-2xl bg-[var(--hvo-surface)]" />
        </div>
        <div className="relative p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-[var(--hvo-magenta)]/10">
              <Key className="h-5 w-5 text-[var(--hvo-magenta)]" />
            </div>
            <h2 className="text-lg font-display tracking-wide text-white">
              {t("changePassword")}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <CosmicInput
              label={t("currentPassword")}
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              icon={<Lock className="h-5 w-5" />}
              required
              autoComplete="current-password"
            />

            <CosmicInput
              label={t("newPassword")}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Create new password"
              icon={<Lock className="h-5 w-5" />}
              required
              autoComplete="new-password"
            />

            <CosmicInput
              label={t("confirmPassword")}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              icon={<Lock className="h-5 w-5" />}
              required
              autoComplete="new-password"
            />

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 rounded-xl bg-[var(--hvo-magenta)]/10 border border-[var(--hvo-magenta)]/30"
              >
                <AlertCircle className="h-5 w-5 text-[var(--hvo-magenta)] shrink-0" />
                <p className="text-sm text-[var(--hvo-magenta)]">{error}</p>
              </motion.div>
            )}

            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/30"
              >
                <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                <p className="text-sm text-green-500">{t("passwordChanged")}</p>
              </motion.div>
            )}

            <CosmicButton
              type="submit"
              loading={loading}
              icon={<Key className="h-4 w-4" />}
              className="w-full"
              size="md"
            >
              {loading ? "Updating..." : t("changePassword")}
            </CosmicButton>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
