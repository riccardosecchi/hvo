"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Pencil, Trash2, MapPin, Calendar, Loader2, Users, Eye, ExternalLink, FormInput } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import type { Event } from "@/lib/database.types";
import { getBookingStats } from "@/lib/supabase/bookings";

interface EventsTableProps {
  events: Event[];
  locale: string;
  onEdit: (event: Event) => void;
}

interface BookingStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export function EventsTable({ events, locale, onEdit }: EventsTableProps) {
  const t = useTranslations("admin.events");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [bookingStats, setBookingStats] = useState<Record<string, BookingStats>>({});

  // Load booking stats for internal events
  useEffect(() => {
    const loadStats = async () => {
      const internalEvents = events.filter((e) => e.booking_type === "internal");
      const stats: Record<string, BookingStats> = {};

      await Promise.all(
        internalEvents.map(async (event) => {
          try {
            stats[event.id] = await getBookingStats(event.id);
          } catch {
            stats[event.id] = { total: 0, pending: 0, approved: 0, rejected: 0 };
          }
        })
      );

      setBookingStats(stats);
    };
    loadStats();
  }, [events]);

  const handleToggle = async (id: string, field: "is_active" | "is_booking_open", value: boolean) => {
    const supabase = createClient();
    await supabase.from("events").update({ [field]: value }).eq("id", id);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);

    const supabase = createClient();
    const event = events.find(e => e.id === deleteId);

    if (event?.image_url) {
      const imagePath = event.image_url.split("/").pop();
      if (imagePath) {
        await supabase.storage.from("event-images").remove([imagePath]);
      }
    }

    await supabase.from("events").delete().eq("id", deleteId);
    setDeleteId(null);
    setDeleting(false);
    router.refresh();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(locale === "it" ? "it-IT" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <>
      {/* Events Grid */}
      <div className="space-y-3">
        {events.map((event) => (
          <div
            key={event.id}
            className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-[var(--surface-1)] border border-white/[0.06] rounded-lg hover:border-[var(--accent)]/30 transition-colors"
          >
            {/* Image */}
            <div className="w-full sm:w-24 h-20 sm:h-14 rounded-md overflow-hidden bg-[var(--surface-2)] shrink-0">
              {event.image_url ? (
                <Image
                  src={event.image_url}
                  alt={event.name}
                  width={96}
                  height={56}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-[var(--text-muted)]" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-white truncate">{event.name}</h3>
                {/* Booking type badge */}
                <span
                  className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${event.booking_type === "internal"
                      ? "bg-purple-500/10 text-purple-400"
                      : "bg-[var(--surface-3)] text-[var(--text-muted)]"
                    }`}
                >
                  {event.booking_type === "internal" ? (
                    <FormInput className="w-3 h-3 inline mr-0.5" />
                  ) : (
                    <ExternalLink className="w-3 h-3 inline mr-0.5" />
                  )}
                  {event.booking_type === "internal" ? "Form" : "Link"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-[var(--text-muted)]">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {event.location}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(event.date)}
                </span>
                {/* Booking stats for internal events */}
                {event.booking_type === "internal" && bookingStats[event.id] && (
                  <Link
                    href={`/${locale}/admin/events/${event.id}`}
                    className="flex items-center gap-1 text-[var(--accent)] hover:text-white transition-colors"
                  >
                    <Users className="w-3.5 h-3.5" />
                    {bookingStats[event.id].total} prenotazioni
                    {bookingStats[event.id].pending > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 text-[10px] font-medium bg-yellow-500/10 text-yellow-500 rounded">
                        {bookingStats[event.id].pending} in attesa
                      </span>
                    )}
                  </Link>
                )}
              </div>
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-muted)]">{t("isActive")}</span>
                <button
                  onClick={() => handleToggle(event.id, "is_active", !event.is_active)}
                  className={`w-10 h-6 rounded-full transition-colors relative ${event.is_active ? "bg-[var(--accent)]" : "bg-[var(--surface-2)]"
                    }`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${event.is_active ? "left-5" : "left-1"
                    }`} />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-muted)]">{t("isBookingOpen")}</span>
                <button
                  onClick={() => handleToggle(event.id, "is_booking_open", !event.is_booking_open)}
                  className={`w-10 h-6 rounded-full transition-colors relative ${event.is_booking_open ? "bg-[#22C55E]" : "bg-[var(--surface-2)]"
                    }`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${event.is_booking_open ? "left-5" : "left-1"
                    }`} />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {event.booking_type === "internal" && (
                <Link
                  href={`/${locale}/admin/events/${event.id}`}
                  className="p-2 rounded-md text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors"
                  title="Vedi dettagli"
                >
                  <Eye className="w-4 h-4" />
                </Link>
              )}
              <button
                onClick={() => onEdit(event)}
                className="p-2 rounded-md text-[var(--text-muted)] hover:text-white hover:bg-white/5 transition-colors"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeleteId(event.id)}
                className="p-2 rounded-md text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Dialog */}
      <AnimatePresence>
        {deleteId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              onClick={() => setDeleteId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm p-6 bg-[var(--surface-1)] border border-white/[0.08] rounded-lg"
            >
              <h3 className="text-lg font-semibold text-white mb-2">{tCommon("delete")}</h3>
              <p className="text-sm text-[var(--text-muted)] mb-6">{t("deleteConfirm")}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 px-4 py-2.5 rounded-md text-[var(--text-secondary)] hover:bg-white/5 transition-colors"
                >
                  {tCommon("cancel")}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : tCommon("delete")}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
