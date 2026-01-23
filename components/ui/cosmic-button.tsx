"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface CosmicButtonProps {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
}

export function CosmicButton({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  children,
  disabled,
  type = "button",
  onClick,
}: CosmicButtonProps) {
  const baseStyles =
    "relative inline-flex items-center justify-center gap-2 font-display tracking-[0.1em] uppercase rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden";

  const variants = {
    primary:
      "bg-[var(--hvo-cyan)] text-[var(--hvo-void)] hover:shadow-[0_0_30px_rgba(0,229,255,0.4)] active:scale-[0.98]",
    secondary:
      "bg-transparent border-2 border-[var(--hvo-cyan)] text-[var(--hvo-cyan)] hover:bg-[var(--hvo-cyan)]/10 hover:shadow-[0_0_20px_rgba(0,229,255,0.2)]",
    ghost:
      "bg-transparent text-[var(--hvo-text-secondary)] hover:text-[var(--hvo-cyan)] hover:bg-[var(--hvo-cyan)]/5",
  };

  const sizes = {
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-3.5 text-sm",
    lg: "px-8 py-4 text-base",
  };

  return (
    <motion.button
      type={type}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      onClick={onClick}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
    >
      {/* Shine effect */}
      {variant === "primary" && (
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
      )}

      {/* Content */}
      <span className="relative flex items-center gap-2">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          icon && <span>{icon}</span>
        )}
        {children}
      </span>
    </motion.button>
  );
}
