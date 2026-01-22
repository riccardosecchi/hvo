import { useTranslations } from "next-intl";
import { EventCard } from "./event-card";
import type { Event } from "@/lib/database.types";

interface EventsListProps {
  events: Event[];
}

export function EventsList({ events }: EventsListProps) {
  const t = useTranslations("events");

  return (
    <section id="events" className="py-16 px-4">
      <div className="container mx-auto max-w-4xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          {t("title")}
        </h2>

        {events.length === 0 ? (
          <p className="text-center text-muted-foreground text-lg">
            {t("noEvents")}
          </p>
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
