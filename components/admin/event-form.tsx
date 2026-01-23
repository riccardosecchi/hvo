"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  X,
  Calendar,
  Clock,
  MapPin,
  Link as LinkIcon,
  Type,
  ImageIcon
} from "lucide-react";
import Image from "next/image";
import type { Event } from "@/lib/database.types";
import { CosmicInput } from "@/components/ui/cosmic-input";
import { CosmicButton } from "@/components/ui/cosmic-button";

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
  const [isActive, setIsActive] = useState(event?.is_active || false);
  const [isBookingOpen, setIsBookingOpen] = useState(event?.is_booking_open || false);
  const [imageUrl, setImageUrl] = useState(event?.image_url || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(event?.image_url || "");
  const [loading, setLoading] = useState(false);

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
      booking_link: bookingLink || null,
      is_active: isActive,
      is_booking_open: isBookingOpen,
      image_url: finalImageUrl || null,
    };

    if (event) {
      await supabase.from("events").update(eventData).eq("id", event.id);
    } else {
      await supabase.from("events").insert(eventData);
    }

    setLoading(false);
    onClose();
    router.refresh();
  };

  const resetForm = () => {
    setName(event?.name || "");
    setLocation(event?.location || "");
    setDate(event?.date || "");
    setTime(event?.time?.slice(0, 5) || "");
    setBookingLink(event?.booking_link || "");
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
            className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 sm:w-full sm:max-w-lg max-h-[90vh] overflow-hidden rounded-2xl"
          >
            <div className="relative h-full flex flex-col rounded-2xl overflow-hidden">
              {/* Gradient border */}
              <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-br from-[var(--hvo-cyan)]/30 via-transparent to-[var(--hvo-magenta)]/30">
                <div className="absolute inset-[1px] rounded-2xl bg-[var(--hvo-surface)]" />
              </div>

              {/* Content */}
              <div className="relative flex-1 overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-[var(--hvo-surface)] border-b border-[var(--hvo-border)] px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-display tracking-wide text-white">
                      {event ? tCommon("edit") : t("new")}
                    </h2>
                    <button
                      onClick={handleClose}
                      className="p-2 rounded-lg text-[var(--hvo-text-muted)] hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                  {/* Image upload */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[var(--hvo-text-secondary)]">
                      {t("image")}
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="relative border-2 border-dashed border-[var(--hvo-border)] rounded-xl overflow-hidden cursor-pointer hover:border-[var(--hvo-cyan)]/50 transition-colors group"
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
                            className="absolute top-3 right-3 p-2 rounded-lg bg-[var(--hvo-magenta)] text-white hover:bg-[var(--hvo-magenta)]/80 transition-colors"
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
                        <div className="py-10 flex flex-col items-center gap-3 text-[var(--hvo-text-muted)]">
                          <div className="p-3 rounded-xl bg-[var(--hvo-cyan)]/10 group-hover:bg-[var(--hvo-cyan)]/20 transition-colors">
                            <ImageIcon className="h-6 w-6 text-[var(--hvo-cyan)]" />
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

                  <CosmicInput
                    label={t("bookingLink")}
                    type="url"
                    value={bookingLink}
                    onChange={(e) => setBookingLink(e.target.value)}
                    placeholder="https://..."
                    icon={<LinkIcon className="h-5 w-5" />}
                  />

                  {/* Toggle switches */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--hvo-deep)] border border-[var(--hvo-border)]">
                      <div>
                        <p className="text-sm font-medium text-white">{t("isActive")}</p>
                        <p className="text-xs text-[var(--hvo-text-muted)]">Show event on homepage</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsActive(!isActive)}
                        className={`relative w-12 h-7 rounded-full transition-colors ${
                          isActive ? "bg-[var(--hvo-cyan)]" : "bg-[var(--hvo-surface)]"
                        }`}
                      >
                        <span
                          className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                            isActive ? "translate-x-5" : ""
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--hvo-deep)] border border-[var(--hvo-border)]">
                      <div>
                        <p className="text-sm font-medium text-white">{t("isBookingOpen")}</p>
                        <p className="text-xs text-[var(--hvo-text-muted)]">Enable booking button</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsBookingOpen(!isBookingOpen)}
                        className={`relative w-12 h-7 rounded-full transition-colors ${
                          isBookingOpen ? "bg-[var(--hvo-magenta)]" : "bg-[var(--hvo-surface)]"
                        }`}
                      >
                        <span
                          className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                            isBookingOpen ? "translate-x-5" : ""
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
