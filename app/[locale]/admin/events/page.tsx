"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Plus, Calendar, Loader2 } from "lucide-react";
import { EventsTable } from "@/components/admin/events-table";
import { EventForm } from "@/components/admin/event-form";
import type { Event } from "@/lib/database.types";

interface EventsPageProps {
  params: Promise<{ locale: string }>;
}

export default function EventsPage({ params }: EventsPageProps) {
  const t = useTranslations("admin.events");
  const [events, setEvents] = useState<Event[]>([]);
  const [editEvent, setEditEvent] = useState<Event | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [locale, setLocale] = useState("it");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(p => setLocale(p.locale));
  }, [params]);

  useEffect(() => {
    const fetchEvents = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("events")
        .select("*")
        .order("date", { ascending: false });
      setEvents(data || []);
      setLoading(false);
    };
    fetchEvents();
  }, [showForm]);

  const handleEdit = (event: Event) => {
    setEditEvent(event);
    setShowForm(true);
  };

  const handleClose = () => {
    setEditEvent(null);
    setShowForm(false);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white mb-1">
            {t("title")}
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Create and manage your events
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--accent)] text-white font-medium text-sm tracking-wide uppercase rounded-md hover:bg-[var(--accent-hover)] transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t("new")}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-[var(--accent)] animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-white/[0.06] rounded-lg bg-[var(--surface-1)]">
          <div className="w-16 h-16 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8 text-[var(--accent)]" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No events yet</h3>
          <p className="text-sm text-[var(--text-muted)] max-w-xs">
            Create your first event to get started. Events will appear on your public homepage.
          </p>
        </div>
      ) : (
        <EventsTable events={events} locale={locale} onEdit={handleEdit} />
      )}

      <EventForm
        event={editEvent}
        open={showForm}
        onClose={handleClose}
      />
    </div>
  );
}
