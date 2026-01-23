"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Link as LinkIcon,
  Type,
  ImageIcon,
  ExternalLink,
  FormInput,
} from "lucide-react";
import Image from "next/image";
import type { Event, BookingFieldConfig } from "@/lib/database.types";
import { CosmicInput } from "@/components/ui/cosmic-input";
import { CosmicButton } from "@/components/ui/cosmic-button";
import { BookingFieldBuilder } from "./booking-field-builder";
import { getEventBookingFields, saveEventBookingFields } from "@/lib/supabase/bookings";

interface EventFormProps {
  event: Event | null;
  open: boolean;
  onClose: () => void;
}

export function EventForm({ event, open, onClose }: EventFormProps) {
  const t = useTranslations("admin.events");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(event?.name || "");
  const [location, setLocation] = useState(event?.location || "");
  const [date, setDate] = useState(event?.date || "");
  const [time, setTime] = useState(event?.time?.slice(0, 5) || "");
  const [bookingLink, setBookingLink] = useState(event?.booking_link || "");
  const [bookingType, setBookingType] = useState<"external" | "internal">(
    event?.booking_type || "external"
  );
  const [bookingFields, setBookingFields] = useState<BookingFieldConfig[]>([]);
  const [isActive, setIsActive] = useState(event?.is_active || false);
  const [isBookingOpen, setIsBookingOpen] = useState(event?.is_booking_open || false);
  const [imageUrl, setImageUrl] = useState(event?.image_url || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(event?.image_url || "");
  const [loading, setLoading] = useState(false);

  // Load existing booking fields when editing
  useEffect(() => {
    if (event?.id && event.booking_type === "internal") {
      getEventBookingFields(event.id).then((fields) => {
        setBookingFields(
          fields.map((f) => ({
            field_name: f.field_name,
            field_label: f.field_label,
            field_type: f.field_type,
            field_options: f.field_options,
            is_required: f.is_required,
          }))
        );
      });
    }
  }, [event?.id, event?.booking_type]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    let finalImageUrl = imageUrl;

    // Upload new image if selected
    if (imageFile) {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from("event-images")
        .upload(fileName, imageFile);

      if (!uploadError && data) {
        const { data: { publicUrl } } = supabase.storage
          .from("event-images")
          .getPublicUrl(data.path);
        finalImageUrl = publicUrl;

        // Delete old image if updating
        if (event?.image_url) {
          const oldPath = event.image_url.split("/").pop();
          if (oldPath) {
            await supabase.storage.from("event-images").remove([oldPath]);
          }
        }
      }
    }

    const eventData = {
      name,
      location,
      date,
      time,
      booking_link: bookingType === "external" ? bookingLink : null,
      booking_type: bookingType,
      is_active: isActive,
      is_booking_open: isBookingOpen,
      image_url: finalImageUrl || null,
    };

    let eventId = event?.id;

    try {
      if (event) {
        const { error } = await supabase.from("events").update(eventData).eq("id", event.id);
        if (error) throw error;
      } else {
        const { data: newEvent, error } = await supabase
          .from("events")
          .insert(eventData)
          .select()
          .single();

        if (error) throw error;
        eventId = newEvent?.id;
      }

      // Save booking fields if internal booking
      if (bookingType === "internal" && eventId) {
        await saveEventBookingFields(eventId, bookingFields);
      }

      setLoading(false);
      onClose();
      router.refresh();
    } catch (error) {
      console.error("Error saving event:", error);
      alert("Error saving event: " + (error as any).message);
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName(event?.name || "");
    setLocation(event?.location || "");
    setDate(event?.date || "");
    setTime(event?.time?.slice(0, 5) || "");
    setBookingLink(event?.booking_link || "");
    setBookingType(event?.booking_type || "external");
    setBookingFields([]);
    setIsActive(event?.is_active || false);
    setIsBookingOpen(event?.is_booking_open || false);
    setImageUrl(event?.image_url || "");
    setImageFile(null);
    setImagePreview(event?.image_url || "");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 sm:w-full sm:max-w-2xl sm:max-h-[85vh] rounded-2xl flex flex-col"
          >
            <div className="relative flex flex-col rounded-lg bg-[var(--surface-1)] border border-white/[0.08] max-h-full overflow-hidden">
              {/* Content */}
              <div className="relative flex-1 overflow-y-auto overflow-x-hidden min-h-0">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-[var(--surface-1)] border-b border-white/[0.06] px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">
                      {event ? tCommon("edit") : t("new")}
                    </h2>
                    <button
                      onClick={handleClose}
                      className="p-2 rounded-md text-[var(--text-muted)] hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                  {/* Image upload */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[var(--text-secondary)]">
                      {t("image")}
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="relative border-2 border-dashed border-white/[0.08] rounded-md overflow-hidden cursor-pointer hover:border-[var(--accent)]/50 transition-colors group"
                    >
                      {imagePreview ? (
                        <div className="relative aspect-video">
                          <Image
                            src={imagePreview}
                            alt="Preview"
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <p className="text-white text-sm font-medium">Click to change</p>
                          </div>
                          <button
                            type="button"
                            className="absolute top-3 right-3 p-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setImageFile(null);
                              setImagePreview("");
                              setImageUrl("");
                            }}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="py-10 flex flex-col items-center gap-3 text-[var(--text-muted)]">
                          <div className="p-3 rounded-md bg-[var(--accent)]/10 group-hover:bg-[var(--accent)]/20 transition-colors">
                            <ImageIcon className="h-6 w-6 text-[var(--accent)]" />
                          </div>
                          <p className="text-sm">{t("uploadImage")}</p>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </div>
                  </div>

                  <CosmicInput
                    label={t("name")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Event name"
                    icon={<Type className="h-5 w-5" />}
                    required
                  />

                  <CosmicInput
                    label={t("location")}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Venue location"
                    icon={<MapPin className="h-5 w-5" />}
                    required
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <CosmicInput
                      label={t("date")}
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      icon={<Calendar className="h-5 w-5" />}
                      required
                    />
                    <CosmicInput
                      label={t("time")}
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      icon={<Clock className="h-5 w-5" />}
                      required
                    />
                  </div>

                  {/* Booking Type Selection */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-[var(--text-secondary)]">
                      Tipo di prenotazione
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setBookingType("external")}
                        className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${bookingType === "external"
                          ? "border-[var(--accent)] bg-[var(--accent)]/10"
                          : "border-white/[0.06] bg-[var(--surface-2)] hover:border-white/[0.1]"
                          }`}
                      >
                        <ExternalLink className={`w-5 h-5 ${bookingType === "external" ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}`} />
                        <div className="text-left">
                          <p className={`text-sm font-medium ${bookingType === "external" ? "text-white" : "text-[var(--text-secondary)]"}`}>
                            Link Esterno
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">
                            Eventbrite, etc.
                          </p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBookingType("internal")}
                        className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${bookingType === "internal"
                          ? "border-[var(--accent)] bg-[var(--accent)]/10"
                          : "border-white/[0.06] bg-[var(--surface-2)] hover:border-white/[0.1]"
                          }`}
                      >
                        <FormInput className={`w-5 h-5 ${bookingType === "internal" ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}`} />
                        <div className="text-left">
                          <p className={`text-sm font-medium ${bookingType === "internal" ? "text-white" : "text-[var(--text-secondary)]"}`}>
                            Form Interno
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">
                            Gestisci tu
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* External booking link */}
                  {bookingType === "external" && (
                    <CosmicInput
                      label={t("bookingLink")}
                      type="url"
                      value={bookingLink}
                      onChange={(e) => setBookingLink(e.target.value)}
                      placeholder="https://..."
                      icon={<LinkIcon className="h-5 w-5" />}
                    />
                  )}

                  {/* Internal booking form builder */}
                  {bookingType === "internal" && (
                    <div className="p-4 rounded-lg bg-[var(--surface-2)] border border-white/[0.06]">
                      <BookingFieldBuilder
                        fields={bookingFields}
                        onChange={setBookingFields}
                      />
                    </div>
                  )}

                  {/* Toggle switches */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between p-4 rounded-md bg-[var(--surface-2)] border border-white/[0.06]">
                      <div>
                        <p className="text-sm font-medium text-white">{t("isActive")}</p>
                        <p className="text-xs text-[var(--text-muted)]">Show event on homepage</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsActive(!isActive)}
                        className={`relative w-12 h-7 rounded-full transition-colors ${isActive ? "bg-[var(--accent)]" : "bg-[var(--surface-1)]"
                          }`}
                      >
                        <span
                          className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${isActive ? "translate-x-5" : ""
                            }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-md bg-[var(--surface-2)] border border-white/[0.06]">
                      <div>
                        <p className="text-sm font-medium text-white">{t("isBookingOpen")}</p>
                        <p className="text-xs text-[var(--text-muted)]">Enable booking button</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsBookingOpen(!isBookingOpen)}
                        className={`relative w-12 h-7 rounded-full transition-colors ${isBookingOpen ? "bg-[#22C55E]" : "bg-[var(--surface-1)]"
                          }`}
                      >
                        <span
                          className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${isBookingOpen ? "translate-x-5" : ""
                            }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <CosmicButton
                      type="button"
                      variant="ghost"
                      onClick={handleClose}
                      className="flex-1"
                    >
                      {tCommon("cancel")}
                    </CosmicButton>
                    <CosmicButton
                      type="submit"
                      loading={loading}
                      className="flex-1"
                    >
                      {loading ? "Saving..." : tCommon("save")}
                    </CosmicButton>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
