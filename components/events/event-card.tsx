"use client";

import { motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import { MapPin, Calendar, Clock, ArrowUpRight } from "lucide-react";
import type { Event } from "@/lib/database.types";

interface EventCardProps {
  event: Event;
  index: number;
}

export function EventCard({ event, index }: EventCardProps) {
  const t = useTranslations("events");
  const locale = useLocale();

  const formattedDate = new Date(event.date).toLocaleDateString(
    locale === "it" ? "it-IT" : "en-US",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
    }
  );

  const formattedTime = event.time.slice(0, 5);

  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration: 0.7,
        delay: index * 0.15,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="group relative"
    >
      {/* Card Container */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--hvo-surface)] to-[var(--hvo-deep)] border border-[var(--hvo-border)] transition-all duration-500 hover:border-[var(--hvo-cyan)]/30">
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--hvo-cyan)]/5 to-[var(--hvo-magenta)]/5" />
        </div>

        {/* Glow effect on hover */}
        <div
          className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: "linear-gradient(135deg, rgba(0, 229, 255, 0.1), transparent, rgba(233, 30, 140, 0.1))",
            filter: "blur(20px)",
          }}
        />

        <div className="relative flex flex-col md:flex-row">
          {/* Image Section */}
          <div className="relative w-full md:w-2/5 aspect-[4/3] md:aspect-auto overflow-hidden">
            {event.image_url ? (
              <>
                <Image
                  src={event.image_url}
                  alt={event.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, 40vw"
                />
                {/* Image overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[var(--hvo-surface)] md:block hidden" />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--hvo-surface)] to-transparent md:hidden" />
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--hvo-cyan)]/20 via-[var(--hvo-violet)]/10 to-[var(--hvo-magenta)]/20" />
            )}

            {/* Date badge */}
            <div className="absolute top-4 left-4 px-4 py-2 rounded-lg bg-[var(--hvo-void)]/80 backdrop-blur-md border border-[var(--hvo-border)]">
              <p className="font-display text-xs tracking-[0.2em] uppercase text-[var(--hvo-cyan)]">
                {new Date(event.date).toLocaleDateString(locale === "it" ? "it-IT" : "en-US", {
                  day: "numeric",
                  month: "short",
                })}
              </p>
            </div>
          </div>

          {/* Content Section */}
          <div className="relative flex-1 p-6 md:p-8 flex flex-col justify-center">
            {/* Event Name */}
            <h3 className="text-2xl md:text-3xl lg:text-4xl font-display tracking-wide text-white mb-4 group-hover:text-[var(--hvo-cyan)] transition-colors duration-300">
              {event.name}
            </h3>

            {/* Event Details */}
            <div className="flex flex-wrap gap-4 md:gap-6 mb-6">
              <div className="flex items-center gap-2 text-[var(--hvo-text-secondary)]">
                <div className="p-2 rounded-lg bg-[var(--hvo-cyan)]/10 text-[var(--hvo-cyan)]">
                  <MapPin className="h-4 w-4" />
                </div>
                <span className="text-sm">{event.location}</span>
              </div>

              <div className="flex items-center gap-2 text-[var(--hvo-text-secondary)]">
                <div className="p-2 rounded-lg bg-[var(--hvo-magenta)]/10 text-[var(--hvo-magenta)]">
                  <Calendar className="h-4 w-4" />
                </div>
                <span className="text-sm capitalize">{formattedDate}</span>
              </div>

              <div className="flex items-center gap-2 text-[var(--hvo-text-secondary)]">
                <div className="p-2 rounded-lg bg-[var(--hvo-violet)]/10 text-[var(--hvo-violet)]">
                  <Clock className="h-4 w-4" />
                </div>
                <span className="text-sm">{formattedTime}</span>
              </div>
            </div>

            {/* CTA Button */}
            {event.is_booking_open && event.booking_link && (
              <motion.a
                href={event.booking_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 w-fit px-6 py-3 rounded-xl font-display text-sm tracking-[0.1em] uppercase bg-[var(--hvo-cyan)] text-[var(--hvo-void)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,229,255,0.4)] hover:scale-105"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                {t("book")}
                <ArrowUpRight className="h-4 w-4" />
              </motion.a>
            )}

            {/* Decorative line */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[var(--hvo-cyan)]/0 via-[var(--hvo-cyan)]/30 to-[var(--hvo-magenta)]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
        </div>
      </div>
    </motion.article>
  );
}
