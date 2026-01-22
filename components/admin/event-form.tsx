"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";
import type { Event } from "@/lib/database.types";

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

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        resetForm();
        onClose();
      }
    }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event ? tCommon("edit") : t("new")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image upload */}
          <div className="space-y-2">
            <Label>{t("image")}</Label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
            >
              {imagePreview ? (
                <div className="relative aspect-video">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-cover rounded"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageFile(null);
                      setImagePreview("");
                      setImageUrl("");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="py-8">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">{t("uploadImage")}</p>
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

          <div className="space-y-2">
            <Label htmlFor="name">{t("name")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-input border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">{t("location")}</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              className="bg-input border-border"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">{t("date")}</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">{t("time")}</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="bg-input border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bookingLink">{t("bookingLink")}</Label>
            <Input
              id="bookingLink"
              type="url"
              value={bookingLink}
              onChange={(e) => setBookingLink(e.target.value)}
              placeholder="https://"
              className="bg-input border-border"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="isActive">{t("isActive")}</Label>
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="isBookingOpen">{t("isBookingOpen")}</Label>
            <Switch
              id="isBookingOpen"
              checked={isBookingOpen}
              onCheckedChange={setIsBookingOpen}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="flex-1"
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary text-primary-foreground"
              disabled={loading}
            >
              {loading ? "..." : tCommon("save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
