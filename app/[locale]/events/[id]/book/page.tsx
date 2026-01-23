"use client";

import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { Event, EventBookingField } from "@/lib/database.types";
import { getEventBookingFields } from "@/lib/supabase/bookings";
import { submitBooking } from "@/lib/actions/booking";
import { CosmicButton } from "@/components/ui/cosmic-button";

interface BookingPageProps {
    params: Promise<{ locale: string; id: string }>;
}

export default function BookingPage({ params }: BookingPageProps) {
    const { locale, id } = use(params);

    const [event, setEvent] = useState<Event | null>(null);
    const [fields, setFields] = useState<EventBookingField[]>([]);
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient();

            // Fetch event
            const { data: eventData } = await supabase
                .from("events")
                .select("*")
                .eq("id", id)
                .eq("is_active", true)
                .eq("is_booking_open", true)
                .eq("booking_type", "internal")
                .single();

            if (eventData) {
                setEvent(eventData);
                // Fetch booking fields
                const fieldsData = await getEventBookingFields(id);
                setFields(fieldsData);
            }

            setLoading(false);
        };
        fetchData();
    }, [id]);

    const handleInputChange = (fieldName: string, value: string) => {
        setFormData((prev) => ({ ...prev, [fieldName]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            // Create FormData from the form element
            const form = e.currentTarget;
            const formDataObj = new FormData(form);

            // Submit via server action
            const result = await submitBooking(formDataObj);

            if (result.success) {
                setSubmitted(true);
            } else {
                setError(result.error || "Errore durante l'invio. Riprova.");
            }
        } catch (err) {
            setError("Errore durante l'invio. Riprova.");
            console.error(err);
        }
        setSubmitting(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 text-center">
                <h1 className="text-2xl font-bold text-white mb-4">
                    Prenotazioni non disponibili
                </h1>
                <p className="text-[var(--text-muted)] mb-6">
                    Questo evento non esiste o le prenotazioni sono chiuse.
                </p>
                <Link
                    href={`/${locale}`}
                    className="inline-flex items-center gap-2 text-[var(--accent)] hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Torna alla home
                </Link>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center px-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full text-center"
                >
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/10 flex items-center justify-center">
                        <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-4">
                        Prenotazione inviata!
                    </h1>
                    <p className="text-[var(--text-muted)] mb-8">
                        Riceverai una conferma quando la tua prenotazione sarà approvata.
                    </p>
                    <Link
                        href={`/${locale}`}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-white font-medium rounded-lg hover:bg-[var(--accent-hover)] transition-colors"
                    >
                        Torna alla home
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black py-12 px-4">
            <div className="max-w-lg mx-auto">
                {/* Back Link */}
                <Link
                    href={`/${locale}`}
                    className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-white transition-colors mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Torna alla home
                </Link>

                {/* Event Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl overflow-hidden bg-[var(--surface-1)] border border-white/[0.06] mb-8"
                >
                    {event.image_url && (
                        <div className="relative h-48 w-full">
                            <Image
                                src={event.image_url}
                                alt={event.name}
                                fill
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        </div>
                    )}
                    <div className={`p-6 ${event.image_url ? "-mt-16 relative" : ""}`}>
                        <h1 className="text-2xl font-bold text-white mb-3">{event.name}</h1>
                        <div className="flex flex-wrap gap-4 text-sm text-[var(--text-muted)]">
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
                </motion.div>

                {/* Booking Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-xl bg-[var(--surface-1)] border border-white/[0.06] p-6"
                >
                    <h2 className="text-lg font-semibold text-white mb-6">
                        Compila il form per prenotare
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Hidden event ID */}
                        <input type="hidden" name="eventId" value={id} />

                        {/* HONEYPOT FIELDS - Hidden from humans, visible to bots */}
                        <div
                            aria-hidden="true"
                            style={{
                                position: 'absolute',
                                left: '-9999px',
                                top: '-9999px',
                            }}
                        >
                            <label htmlFor="website">Website</label>
                            <input
                                type="text"
                                id="website"
                                name="website"
                                tabIndex={-1}
                                autoComplete="off"
                            />
                        </div>
                        <div
                            aria-hidden="true"
                            style={{ display: 'none' }}
                        >
                            <label htmlFor="phone_confirm">Confirm Phone</label>
                            <input
                                type="text"
                                id="phone_confirm"
                                name="phone_confirm"
                                tabIndex={-1}
                                autoComplete="off"
                            />
                        </div>

                        {/* Dynamic Form Fields */}
                        {fields.map((field) => (
                            <div key={field.id} className="space-y-2">
                                <label className="block text-sm font-medium text-[var(--text-secondary)]">
                                    {field.field_label}
                                    {field.is_required && (
                                        <span className="text-red-400 ml-1">*</span>
                                    )}
                                </label>

                                {field.field_type === "textarea" ? (
                                    <textarea
                                        name={field.field_name}
                                        value={formData[field.field_name] || ""}
                                        onChange={(e) =>
                                            handleInputChange(field.field_name, e.target.value)
                                        }
                                        required={field.is_required}
                                        rows={4}
                                        maxLength={1000}
                                        className="w-full px-4 py-3 bg-[var(--surface-2)] border border-white/[0.06] rounded-lg text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]/50 resize-none"
                                    />
                                ) : field.field_type === "select" ? (
                                    <select
                                        name={field.field_name}
                                        value={formData[field.field_name] || ""}
                                        onChange={(e) =>
                                            handleInputChange(field.field_name, e.target.value)
                                        }
                                        required={field.is_required}
                                        className="w-full px-4 py-3 bg-[var(--surface-2)] border border-white/[0.06] rounded-lg text-white focus:outline-none focus:border-[var(--accent)]/50"
                                    >
                                        <option value="">Seleziona...</option>
                                        {(field.field_options || []).map((option) => (
                                            <option key={option} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type={field.field_type}
                                        name={field.field_name}
                                        value={formData[field.field_name] || ""}
                                        onChange={(e) =>
                                            handleInputChange(field.field_name, e.target.value)
                                        }
                                        required={field.is_required}
                                        maxLength={field.field_type === 'email' ? 254 : 500}
                                        className="w-full px-4 py-3 bg-[var(--surface-2)] border border-white/[0.06] rounded-lg text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]/50"
                                    />
                                )}
                            </div>
                        ))}

                        {error && (
                            <p className="text-sm text-red-400 bg-red-400/10 px-4 py-2 rounded-lg">
                                {error}
                            </p>
                        )}

                        <CosmicButton
                            type="submit"
                            loading={submitting}
                            className="w-full"
                        >
                            {submitting ? "Invio in corso..." : "Invia prenotazione"}
                        </CosmicButton>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
