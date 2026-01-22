"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Image from "next/image";

interface LoginFormProps {
  locale: string;
}

export function LoginForm({ locale }: LoginFormProps) {
  const t = useTranslations("admin.login");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-md"
    >
      {/* Card */}
      <div className="relative rounded-2xl bg-[var(--hvo-surface)]/60 backdrop-blur-xl border border-[var(--hvo-border)] overflow-hidden">
        {/* Gradient border effect */}
        <div className="absolute inset-0 rounded-2xl pointer-events-none">
          <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-[var(--hvo-cyan)]/50 to-transparent" />
        </div>

        {/* Header */}
        <div className="p-8 pb-0 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative inline-block mb-6"
          >
            <Image
              src="/logos/04_HVO.jpg"
              alt="HVO"
              width={80}
              height={80}
              className="h-20 w-20 object-cover rounded-xl mx-auto"
              style={{
                boxShadow: "0 0 40px rgba(0, 229, 255, 0.3)",
              }}
            />
          </motion.div>

          <h1 className="text-2xl font-display tracking-wide text-white mb-2">
            {t("title")}
          </h1>
          <p className="text-sm text-[var(--hvo-text-muted)]">
            Admin Dashboard
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Email Field */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[var(--hvo-text-secondary)]"
            >
              {t("email")}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-[var(--hvo-deep)] border border-[var(--hvo-border)] text-white placeholder-[var(--hvo-text-muted)] focus:outline-none focus:border-[var(--hvo-cyan)]/50 focus:ring-1 focus:ring-[var(--hvo-cyan)]/50 transition-all"
              placeholder="admin@example.com"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[var(--hvo-text-secondary)]"
            >
              {t("password")}
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 pr-12 rounded-xl bg-[var(--hvo-deep)] border border-[var(--hvo-border)] text-white placeholder-[var(--hvo-text-muted)] focus:outline-none focus:border-[var(--hvo-cyan)]/50 focus:ring-1 focus:ring-[var(--hvo-cyan)]/50 transition-all"
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--hvo-text-muted)] hover:text-[var(--hvo-cyan)] transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-[var(--hvo-magenta)] text-center py-2 px-4 rounded-lg bg-[var(--hvo-magenta)]/10 border border-[var(--hvo-magenta)]/20"
            >
              {error}
            </motion.p>
          )}

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={loading}
            className="relative w-full py-3 px-6 rounded-xl font-display text-sm tracking-[0.1em] uppercase bg-[var(--hvo-cyan)] text-[var(--hvo-void)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,229,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </span>
            ) : (
              t("submit")
            )}
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
}
