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
          <label className="block text-sm font-medium text-[var(--hvo-text-secondary)] mb-2">
            {label}
          </label>
        )}
        <div className="relative group">
          {/* Glow effect on focus */}
          <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-[var(--hvo-cyan)]/0 via-[var(--hvo-cyan)]/0 to-[var(--hvo-magenta)]/0 opacity-0 group-focus-within:opacity-100 group-focus-within:from-[var(--hvo-cyan)]/20 group-focus-within:to-[var(--hvo-magenta)]/20 blur transition-all duration-300" />

          {/* Icon */}
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--hvo-text-muted)] group-focus-within:text-[var(--hvo-cyan)] transition-colors z-10">
              {icon}
            </div>
          )}

          {/* Input */}
          <input
            type={inputType}
            className={cn(
              "relative w-full px-4 py-4 rounded-xl",
              "bg-[var(--hvo-deep)] border-2 border-[var(--hvo-border)]",
              "text-white text-base placeholder:text-[var(--hvo-text-muted)]",
              "focus:outline-none focus:border-[var(--hvo-cyan)]/50",
              "transition-all duration-300",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              icon && "pl-12",
              isPassword && "pr-12",
              error && "border-[var(--hvo-magenta)]/50",
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
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-[var(--hvo-text-muted)] hover:text-[var(--hvo-cyan)] transition-colors z-10"
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
          <p className="text-sm text-[var(--hvo-magenta)] mt-1">{error}</p>
        )}
      </div>
    );
  }
);
CosmicInput.displayName = "CosmicInput";

export { CosmicInput };
