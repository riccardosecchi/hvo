"use client";

import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import { EventCard } from "./event-card";
import type { Event } from "@/lib/database.types";

interface EventsListProps {
  events: Event[];
}

export function EventsList({ events }: EventsListProps) {
  const t = useTranslations("events");
  const locale = useLocale();

  return (
    <section id="events" className="py-20 sm:py-28 lg:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12 sm:mb-16"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-8 bg-[var(--accent)]" />
            <span className="text-xs tracking-[0.3em] uppercase text-[var(--text-muted)]">
              {locale === "it" ? "Prossimi" : "Upcoming"}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white tracking-tight">
            {t("title")}
          </h2>
        </motion.div>

        {/* Events Grid */}
        {events.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="py-24 text-center border border-white/[0.06] rounded-lg bg-[#080808]"
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--surface-2)] flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-lg text-[var(--text-secondary)] mb-2">
              {t("noEvents")}
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              {locale === "it" ? "Resta sintonizzato per i prossimi eventi" : "Stay tuned for upcoming events"}
            </p>
          </motion.div>
        ) : (
          <div className="grid gap-6 sm:gap-8">
            {events.map((event, index) => (
              <EventCard key={event.id} event={event} index={index} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
