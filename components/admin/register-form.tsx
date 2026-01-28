"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Mail, Lock, UserPlus, AlertCircle, Loader2, ShieldX } from "lucide-react";
import Image from "next/image";
import { CosmicInput } from "@/components/ui/cosmic-input";
import { CosmicButton } from "@/components/ui/cosmic-button";

interface RegisterFormProps {
  locale: string;
}

export function RegisterForm({ locale }: RegisterFormProps) {
  const t = useTranslations("admin.login");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkToken = async () => {
      if (!token) {
        setChecking(false);
        return;
      }

      const supabase = createClient();

      // Use RPC function that allows anonymous access
      const { data, error } = await supabase.rpc("validate_invite_token", {
        p_token: token,
      });

      if (!error && data && data.length > 0 && data[0].is_valid) {
        setEmail(data[0].email);
        setValidToken(true);
      }
      setChecking(false);
    };

    checkToken();
  }, [token]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    router.push(`/${locale}/admin/login?registered=true`);
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 text-[var(--text-muted)]"
        >
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Verifying invitation...</span>
        </motion.div>
      </div>
    );
  }

  if (!token || !validToken) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full max-w-md"
        >
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 rounded-3xl p-[1px] bg-gradient-to-br from-[red-500]/30 via-transparent to-[red-500]/30">
              <div className="absolute inset-[1px] rounded-3xl bg-[var(--surface-1)]" />
            </div>
            <div className="relative p-8 sm:p-10 text-center">
              <div className="inline-flex p-4 rounded-2xl bg-[red-500]/10 mb-6">
                <ShieldX className="h-10 w-10 text-[red-500]" />
              </div>
              <h2 className="text-xl font-display text-white mb-2">
                Invalid Invitation
              </h2>
              <p className="text-[var(--text-muted)] text-sm">
                This invitation link is invalid or has expired. Please contact your administrator for a new invitation.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--accent)]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[red-500]/10 rounded-full blur-[120px]" />
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
          <div className="absolute inset-0 rounded-3xl p-[1px] bg-gradient-to-br from-[var(--accent)]/30 via-transparent to-[red-500]/30">
            <div className="absolute inset-[1px] rounded-3xl bg-[var(--surface-1)]" />
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
                <div className="absolute inset-0 rounded-2xl bg-[var(--accent)]/20 blur-xl" />
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
                Create Account
              </h1>
              <p className="text-sm text-[var(--text-muted)]">
                Complete your admin registration
              </p>
            </motion.div>

            {/* Form */}
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <CosmicInput
                label={t("email")}
                type="email"
                value={email}
                disabled
                icon={<Mail className="h-5 w-5" />}
              />

              <CosmicInput
                label={t("password")}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                icon={<Lock className="h-5 w-5" />}
                required
                autoComplete="new-password"
              />

              <CosmicInput
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                icon={<Lock className="h-5 w-5" />}
                required
                autoComplete="new-password"
              />

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-[red-500]/10 border border-[red-500]/30"
                >
                  <AlertCircle className="h-5 w-5 text-[red-500] shrink-0" />
                  <p className="text-sm text-[red-500]">{error}</p>
                </motion.div>
              )}

              {/* Submit Button */}
              <CosmicButton
                type="submit"
                loading={loading}
                icon={<UserPlus className="h-4 w-4" />}
                className="w-full"
                size="lg"
              >
                {loading ? "Creating account..." : "Create Account"}
              </CosmicButton>
            </motion.form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
