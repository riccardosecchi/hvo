"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Mail, Lock, LogIn, AlertCircle } from "lucide-react";
import Image from "next/image";
import { CosmicInput } from "@/components/ui/cosmic-input";
import { CosmicButton } from "@/components/ui/cosmic-button";

interface LoginFormProps {
  locale: string;
}

export function LoginForm({ locale }: LoginFormProps) {
  const t = useTranslations("admin.login");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(t("error"));
      setLoading(false);
      return;
    }

    router.push(`/${locale}/admin/dashboard`);
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--hvo-cyan)]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--hvo-magenta)]/10 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md"
      >
        {/* Card */}
        <div className="relative rounded-3xl overflow-hidden">
          {/* Gradient border */}
          <div className="absolute inset-0 rounded-3xl p-[1px] bg-gradient-to-br from-[var(--hvo-cyan)]/30 via-transparent to-[var(--hvo-magenta)]/30">
            <div className="absolute inset-[1px] rounded-3xl bg-[var(--hvo-surface)]" />
          </div>

          {/* Content */}
          <div className="relative p-8 sm:p-10">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex justify-center mb-8"
            >
              <div className="relative">
                {/* Glow */}
                <div className="absolute inset-0 rounded-2xl bg-[var(--hvo-cyan)]/20 blur-xl" />
                <Image
                  src="/logos/04_HVO.jpg"
                  alt="HVO"
                  width={100}
                  height={100}
                  className="relative w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-2xl"
                  style={{
                    boxShadow: "0 0 40px rgba(0, 229, 255, 0.3)",
                  }}
                  priority
                />
              </div>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center mb-8"
            >
              <h1 className="text-2xl sm:text-3xl font-display tracking-wide text-white mb-2">
                {t("title")}
              </h1>
              <p className="text-sm text-[var(--hvo-text-muted)]">
                Admin Dashboard
              </p>
            </motion.div>

            {/* Form */}
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <CosmicInput
                label={t("email")}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                icon={<Mail className="h-5 w-5" />}
                required
                autoComplete="email"
              />

              <CosmicInput
                label={t("password")}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                icon={<Lock className="h-5 w-5" />}
                required
                autoComplete="current-password"
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

              {/* Submit Button */}
              <CosmicButton
                type="submit"
                loading={loading}
                icon={<LogIn className="h-4 w-4" />}
                className="w-full"
                size="lg"
              >
                {loading ? "Signing in..." : t("submit")}
              </CosmicButton>
            </motion.form>

            {/* Footer */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center text-xs text-[var(--hvo-text-muted)] mt-8"
            >
              Protected area for authorized administrators only
            </motion.p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
