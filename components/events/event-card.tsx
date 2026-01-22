"use client";

import { motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import { MapPin, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  const formattedTime = event.time.slice(0, 5); // HH:MM

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
      className="relative overflow-hidden rounded-xl bg-card border border-border/50 group"
    >
      {/* Image container */}
      <div className="relative aspect-[16/9] overflow-hidden">
        {event.image_url ? (
          <Image
            src={event.image_url}
            alt={event.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20" />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

        {/* Content overlay */}
        <div className="absolute inset-0 p-6 flex flex-col justify-end">
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            {event.name}
          </h3>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-primary" />
              {event.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-primary" />
              {formattedDate}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary" />
              {formattedTime}
            </span>
          </div>

          {event.is_booking_open && event.booking_link && (
            <Button
              asChild
              className="w-fit bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all"
            >
              <a href={event.booking_link} target="_blank" rel="noopener noreferrer">
                {t("book")}
              </a>
            </Button>
          )}
        </div>
      </div>
    </motion.article>
  );
}
