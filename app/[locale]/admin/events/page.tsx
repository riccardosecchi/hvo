"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  if (loading) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-primary text-primary-foreground"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("new")}
        </Button>
      </div>

      <EventsTable events={events} locale={locale} onEdit={handleEdit} />

      <EventForm
        event={editEvent}
        open={showForm}
        onClose={handleClose}
      />
    </div>
  );
}
