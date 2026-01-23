"use client";

import Link from "next/link";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { LanguageToggle } from "./language-toggle";
import { useState } from "react";

interface HeaderProps {
  locale: string;
}

export function Header({ locale }: HeaderProps) {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 50);
  });

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
          ? "bg-black/95 backdrop-blur-md border-b border-white/[0.06]"
          : "bg-transparent"
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Stylized Logo */}
          <Link
            href={`/${locale}`}
            className="flex items-center group"
          >
            <span
              className="text-xl sm:text-2xl font-black tracking-[0.1em] transition-all duration-300"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, #00E5FF 40%, #E91E8C 70%, rgba(255,255,255,0.9) 100%)",
                backgroundSize: "200% 200%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                animation: "gradient-shift 8s ease infinite",
              }}
            >
              HVO
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-4 sm:gap-6">
            {/* Admin Link */}
            <Link
              href={`/${locale}/admin/login`}
              className="text-xs sm:text-sm text-[var(--text-muted)] hover:text-white transition-colors duration-200 tracking-wide"
            >
              Admin
            </Link>

            {/* Divider */}
            <div className="h-4 w-px bg-white/10" />

            {/* Language Toggle */}
            <LanguageToggle />
          </nav>
        </div>
      </div>
    </motion.header>
  );
}
