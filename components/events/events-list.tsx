"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { EventCard } from "./event-card";
import { Calendar } from "lucide-react";
import type { Event } from "@/lib/database.types";

interface EventsListProps {
  events: Event[];
}

export function EventsList({ events }: EventsListProps) {
  const t = useTranslations("events");

  return (
    <section id="events" className="relative py-24 px-4">
      {/* Section background gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[var(--hvo-void)] to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--hvo-void)] to-transparent" />
      </div>

      <div className="container mx-auto max-w-5xl relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          {/* Section label */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--hvo-border)] bg-[var(--hvo-surface)]/50 backdrop-blur-sm mb-6"
          >
            <Calendar className="h-4 w-4 text-[var(--hvo-cyan)]" />
            <span className="text-xs font-display tracking-[0.2em] uppercase text-[var(--hvo-text-muted)]">
              Upcoming
            </span>
          </motion.div>

          {/* Section title */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display tracking-wide text-white mb-4">
            {t("title")}
          </h2>

          {/* Decorative line */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <div className="h-[1px] w-16 bg-gradient-to-r from-transparent to-[var(--hvo-cyan)]" />
            <div className="h-2 w-2 rounded-full bg-[var(--hvo-cyan)] animate-pulse" />
            <div className="h-[1px] w-16 bg-gradient-to-l from-transparent to-[var(--hvo-cyan)]" />
          </div>
        </motion.div>

        {/* Events Grid */}
        {events.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center py-20"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[var(--hvo-surface)] border border-[var(--hvo-border)] mb-6">
              <Calendar className="h-8 w-8 text-[var(--hvo-text-muted)]" />
            </div>
            <p className="text-xl text-[var(--hvo-text-muted)] font-display tracking-wide">
              {t("noEvents")}
            </p>
            <p className="text-[var(--hvo-text-muted)]/60 mt-2">
              Stay tuned for upcoming events
            </p>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {events.map((event, index) => (
              <EventCard key={event.id} event={event} index={index} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
