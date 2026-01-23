"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

export interface CosmicInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const CosmicInput = React.forwardRef<HTMLInputElement, CosmicInputProps>(
  ({ className, type, label, error, icon, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;

    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            {label}
          </label>
        )}
        <div className="relative group">
          {/* Glow effect on focus */}
          <div className="absolute -inset-0.5 rounded-md bg-gradient-to-r from-[var(--accent)]/0 to-[var(--accent)]/0 opacity-0 group-focus-within:opacity-100 group-focus-within:from-[var(--accent)]/10 group-focus-within:to-[var(--accent)]/10 blur transition-all duration-300" />

          {/* Icon */}
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors z-10">
              {icon}
            </div>
          )}

          {/* Input */}
          <input
            type={inputType}
            className={cn(
              "relative w-full px-4 py-3.5 rounded-md",
              "bg-[var(--surface-1)] border border-white/[0.08]",
              "text-white text-base placeholder:text-[var(--text-muted)]",
              "focus:outline-none focus:border-[var(--accent)]/50",
              "transition-all duration-300",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              icon && "pl-12",
              isPassword && "pr-12",
              error && "border-red-500/50",
              className
            )}
            ref={ref}
            {...props}
          />

          {/* Password toggle */}
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors z-10"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p className="text-sm text-red-400 mt-1">{error}</p>
        )}
      </div>
    );
  }
);
CosmicInput.displayName = "CosmicInput";

export { CosmicInput };
