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
    "relative inline-flex items-center justify-center gap-2 font-medium tracking-wide uppercase rounded-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden";

  const variants = {
    primary:
      "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] hover:shadow-[0_0_20px_var(--accent-glow)] active:scale-[0.98]",
    secondary:
      "bg-transparent border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)]/10 hover:shadow-[0_0_15px_var(--accent-glow)]",
    ghost:
      "bg-transparent text-[var(--text-secondary)] hover:text-white hover:bg-white/5",
  };

  const sizes = {
    sm: "px-4 py-2 text-xs",
    md: "px-5 py-3 text-sm",
    lg: "px-6 py-3.5 text-base",
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
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
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
