"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import Image from "next/image";

export function Hero() {
  const t = useTranslations("hero");

  const scrollToEvents = () => {
    document.getElementById("events")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative"
      >
        <Image
          src="/logos/04_HVO.jpg"
          alt="HVO"
          width={300}
          height={120}
          className="h-24 md:h-32 w-auto"
          priority
        />
        {/* Glow effect */}
        <div className="absolute inset-0 blur-3xl bg-primary/20 -z-10 animate-glow-pulse" />
      </motion.div>

      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
        className="mt-6 text-xl md:text-2xl text-muted-foreground tracking-wide"
      >
        {t("tagline")}
      </motion.p>

      {/* Scroll indicator */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        onClick={scrollToEvents}
        className="absolute bottom-8 text-muted-foreground hover:text-primary transition-colors"
        aria-label="Scroll to events"
      >
        <ChevronDown className="h-8 w-8 animate-bounce-slow" />
      </motion.button>
    </section>
  );
}
