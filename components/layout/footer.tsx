"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { motion } from "framer-motion";
import { Instagram, Mail } from "lucide-react";

export function Footer() {
  const t = useTranslations("footer");
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-[var(--hvo-border)] bg-[var(--hvo-void)]">
      {/* Top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--hvo-cyan)]/30 to-transparent" />

      <div className="container mx-auto px-6 py-16">
        <div className="flex flex-col items-center">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative mb-8"
          >
            <Image
              src="/logos/04_HVO.jpg"
              alt="HVO"
              width={80}
              height={80}
              className="w-20 h-20 object-cover rounded-xl"
              style={{
                boxShadow: "0 0 30px rgba(0, 229, 255, 0.2)",
              }}
            />
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-display text-sm tracking-[0.3em] uppercase text-[var(--hvo-text-muted)] mb-8"
          >
            Underground Electronic Music
          </motion.p>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-4 mb-12"
          >
            <a
              href="https://instagram.com/hvo_events"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl bg-[var(--hvo-surface)] border border-[var(--hvo-border)] text-[var(--hvo-text-muted)] hover:text-[var(--hvo-cyan)] hover:border-[var(--hvo-cyan)]/30 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,229,255,0.15)]"
              aria-label="Instagram"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a
              href="mailto:info@hvoevents.com"
              className="p-3 rounded-xl bg-[var(--hvo-surface)] border border-[var(--hvo-border)] text-[var(--hvo-text-muted)] hover:text-[var(--hvo-magenta)] hover:border-[var(--hvo-magenta)]/30 transition-all duration-300 hover:shadow-[0_0_20px_rgba(233,30,140,0.15)]"
              aria-label="Email"
            >
              <Mail className="h-5 w-5" />
            </a>
          </motion.div>

          {/* Divider */}
          <div className="w-full max-w-xs h-[1px] bg-gradient-to-r from-transparent via-[var(--hvo-border)] to-transparent mb-8" />

          {/* Copyright */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-sm text-[var(--hvo-text-muted)]/60"
          >
            {t("copyright").replace("{year}", currentYear.toString())}
          </motion.p>

          {/* Genre tags */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap justify-center gap-2 mt-6"
          >
            {["Tech House", "House", "Latin House", "Techno"].map((genre) => (
              <span
                key={genre}
                className="px-3 py-1 text-xs tracking-wider uppercase text-[var(--hvo-text-muted)]/40"
              >
                {genre}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </footer>
  );
}
