import { Hero } from "@/components/home/hero";
import { EventsList } from "@/components/events";
import { getActiveEvents } from "@/lib/supabase/queries";

export default async function HomePage() {
  const events = await getActiveEvents();

  return (
    <>
      <Hero />
      <EventsList events={events} />
    </>
  );
}
