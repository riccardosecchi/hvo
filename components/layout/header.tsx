"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { LanguageToggle } from "./language-toggle";

interface HeaderProps {
  locale: string;
}

export function Header({ locale }: HeaderProps) {
  const { scrollY } = useScroll();

  // Header becomes more visible as you scroll
  const headerBg = useTransform(
    scrollY,
    [0, 100],
    ["rgba(5, 8, 16, 0)", "rgba(5, 8, 16, 0.85)"]
  );

  const headerBorder = useTransform(
    scrollY,
    [0, 100],
    ["rgba(0, 229, 255, 0)", "rgba(0, 229, 255, 0.1)"]
  );

  const headerBlur = useTransform(scrollY, [0, 100], ["blur(0px)", "blur(20px)"]);

  return (
    <motion.header
      style={{
        backgroundColor: headerBg,
        borderColor: headerBorder,
        backdropFilter: headerBlur,
        WebkitBackdropFilter: headerBlur,
      }}
      className="fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300"
    >
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link
          href={`/${locale}`}
          className="relative group flex items-center gap-3"
        >
          {/* Logo glow on hover */}
          <motion.div
            className="absolute -inset-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: "radial-gradient(circle, rgba(0, 229, 255, 0.15) 0%, transparent 70%)",
              filter: "blur(10px)",
            }}
          />

          <Image
            src="/logos/04_HVO.jpg"
            alt="HVO"
            width={48}
            height={48}
            className="relative h-12 w-12 object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
            style={{
              boxShadow: "0 0 20px rgba(0, 229, 255, 0.2)",
            }}
            priority
          />

          <span className="relative font-display text-xl tracking-[0.15em] text-white/90 hidden sm:block">
            HVO
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-6">
          {/* Admin Link */}
          <Link
            href={`/${locale}/admin/login`}
            className="relative px-4 py-2 text-sm font-medium tracking-wider uppercase text-[var(--hvo-text-muted)] hover:text-[var(--hvo-cyan)] transition-colors duration-300 hidden md:block"
          >
            Admin
          </Link>

          {/* Language Toggle */}
          <LanguageToggle />
        </nav>
      </div>
    </motion.header>
  );
}
