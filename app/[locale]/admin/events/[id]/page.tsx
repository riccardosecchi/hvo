"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Calendar, Clock, MapPin, Loader2, Edit2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { Event } from "@/lib/database.types";
import { EventBookingsPanel } from "@/components/admin/event-bookings-panel";
import { EventForm } from "@/components/admin/event-form";

interface EventDetailPageProps {
    params: Promise<{ locale: string; id: string }>;
}

export default function EventDetailPage({ params }: EventDetailPageProps) {
    const { locale, id } = use(params);
    const t = useTranslations("admin.events");
    const router = useRouter();

    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        const fetchEvent = async () => {
            const supabase = createClient();
            const { data } = await supabase
                .from("events")
                .select("*")
                .eq("id", id)
                .single();

            setEvent(data);
            setLoading(false);
        };
        fetchEvent();
    }, [id, showForm]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-[var(--accent)] animate-spin" />
            </div>
        );
    }

    if (!event) {
        return (
            <div className="text-center py-20">
                <p className="text-[var(--text-muted)]">Evento non trovato</p>
                <Link
                    href={`/${locale}/admin/events`}
                    className="mt-4 inline-flex items-center gap-2 text-[var(--accent)] hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Torna agli eventi
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <Link
                    href={`/${locale}/admin/events`}
                    className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Torna agli eventi
                </Link>

                <div className="flex flex-col md:flex-row gap-6">
                    {/* Event Image */}
                    {event.image_url && (
                        <div className="relative w-full md:w-48 h-32 md:h-28 rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                                src={event.image_url}
                                alt={event.name}
                                fill
                                className="object-cover"
                            />
                        </div>
                    )}

                    {/* Event Info */}
                    <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-white">{event.name}</h1>
                                <div className="mt-2 flex flex-wrap gap-4 text-sm text-[var(--text-muted)]">
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4" />
                                        {new Date(event.date).toLocaleDateString("it-IT", {
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric",
                                        })}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4" />
                                        {event.time.slice(0, 5)}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <MapPin className="w-4 h-4" />
                                        {event.location}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowForm(true)}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--surface-2)] rounded-md hover:bg-[var(--surface-3)] transition-colors"
                            >
                                <Edit2 className="w-4 h-4" />
                                Modifica
                            </button>
                        </div>

                        {/* Status badges */}
                        <div className="mt-4 flex gap-2">
                            <span
                                className={`px-2.5 py-1 text-xs font-medium rounded-full ${event.is_active
                                        ? "bg-green-500/10 text-green-500"
                                        : "bg-red-500/10 text-red-500"
                                    }`}
                            >
                                {event.is_active ? "Attivo" : "Non attivo"}
                            </span>
                            <span
                                className={`px-2.5 py-1 text-xs font-medium rounded-full ${event.is_booking_open
                                        ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                                        : "bg-[var(--surface-3)] text-[var(--text-muted)]"
                                    }`}
                            >
                                {event.is_booking_open ? "Prenotazioni aperte" : "Prenotazioni chiuse"}
                            </span>
                            <span
                                className={`px-2.5 py-1 text-xs font-medium rounded-full ${event.booking_type === "internal"
                                        ? "bg-purple-500/10 text-purple-400"
                                        : "bg-[var(--surface-3)] text-[var(--text-muted)]"
                                    }`}
                            >
                                {event.booking_type === "internal" ? "Form interno" : "Link esterno"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bookings Panel (only for internal booking type) */}
            {event.booking_type === "internal" ? (
                <div>
                    <h2 className="text-lg font-semibold text-white mb-4">Prenotazioni</h2>
                    <EventBookingsPanel eventId={event.id} eventName={event.name} />
                </div>
            ) : (
                <div className="p-6 rounded-lg bg-[var(--surface-1)] border border-white/[0.06] text-center">
                    <p className="text-[var(--text-muted)]">
                        Questo evento utilizza un link di prenotazione esterno.
                    </p>
                    {event.booking_link && (
                        <a
                            href={event.booking_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-block text-[var(--accent)] hover:text-white transition-colors"
                        >
                            {event.booking_link}
                        </a>
                    )}
                </div>
            )}

            {/* Edit Form Modal */}
            <EventForm
                event={event}
                open={showForm}
                onClose={() => setShowForm(false)}
            />
        </div>
    );
}
