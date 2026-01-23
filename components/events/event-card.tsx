"use client";

import { motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import { ArrowUpRight, MapPin, Calendar } from "lucide-react";
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
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );

  const formattedTime = event.time?.slice(0, 5) || "";

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration: 0.7,
        delay: index * 0.15,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group relative"
    >
      {/* Card Container */}
      <div className="relative overflow-hidden rounded-lg border border-white/[0.06] bg-[#080808] transition-all duration-500 hover:border-white/[0.12] hover:bg-[#0a0a0a]">
        {/* Image Section - 16:9 Aspect Ratio */}
        <div className="relative aspect-[16/9] overflow-hidden">
          {event.image_url ? (
            <>
              <Image
                src={event.image_url}
                alt={event.name}
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px"
                priority={index < 2}
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#111] to-[#080808]">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-6xl font-bold text-white/5 tracking-wider">HVO</span>
              </div>
            </div>
          )}

          {/* Date Badge - Top Right */}
          <div className="absolute top-4 right-4 px-3 py-1.5 rounded-md bg-black/60 backdrop-blur-sm border border-white/10">
            <span className="text-xs font-medium text-white tabular-nums">
              {formattedDate}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-5 sm:p-6">
          {/* Top Row - Location & Time */}
          <div className="flex items-center gap-4 text-[var(--text-muted)] text-xs mb-3">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span className="uppercase tracking-wider">{event.location}</span>
            </div>
            {formattedTime && (
              <>
                <div className="w-px h-3 bg-white/10" />
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="tabular-nums">{formattedTime}</span>
                </div>
              </>
            )}
          </div>

          {/* Event Title */}
          <h3 className="text-xl sm:text-2xl font-semibold text-white mb-4 leading-tight group-hover:text-[var(--accent)] transition-colors duration-300">
            {event.name}
          </h3>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
            {/* Status Indicator */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${event.is_booking_open ? 'bg-[#22C55E]' : 'bg-[var(--text-muted)]'}`} />
              <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
                {event.is_booking_open ? (locale === "it" ? "Prenotazioni Aperte" : "Booking Open") : (locale === "it" ? "Coming Soon" : "Coming Soon")}
              </span>
            </div>

            {/* CTA Button - Only shows when booking is open */}
            {event.is_booking_open && event.booking_link && (
              <a
                href={event.booking_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-black bg-[var(--accent)] rounded-md transition-all duration-300 hover:bg-[var(--accent-hover)] hover:shadow-[0_0_20px_var(--accent-glow)]"
              >
                {locale === "it" ? "Prenotati" : "Book Now"}
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute -inset-px rounded-lg bg-gradient-to-r from-[var(--accent)]/0 via-[var(--accent)]/0 to-[var(--accent)]/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-hover:from-[var(--accent)]/5 group-hover:via-transparent group-hover:to-[var(--accent)]/5 pointer-events-none" />
    </motion.article>
  );
}
