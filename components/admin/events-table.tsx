"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";
import type { Event } from "@/lib/database.types";

interface EventsTableProps {
  events: Event[];
  locale: string;
  onEdit: (event: Event) => void;
}

export function EventsTable({ events, locale, onEdit }: EventsTableProps) {
  const t = useTranslations("admin.events");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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

    // Delete image from storage if exists
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
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-16"></TableHead>
              <TableHead>{t("name")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("location")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("date")}</TableHead>
              <TableHead>{t("isActive")}</TableHead>
              <TableHead>{t("isBookingOpen")}</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No events yet
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    {event.image_url ? (
                      <Image
                        src={event.image_url}
                        alt={event.name}
                        width={48}
                        height={27}
                        className="rounded object-cover aspect-video"
                      />
                    ) : (
                      <div className="w-12 h-7 rounded bg-muted" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{event.name}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {event.location}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {formatDate(event.date)}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={event.is_active}
                      onCheckedChange={(checked) => handleToggle(event.id, "is_active", checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={event.is_booking_open}
                      onCheckedChange={(checked) => handleToggle(event.id, "is_booking_open", checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(event)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(event.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tCommon("delete")}</DialogTitle>
            <DialogDescription>{t("deleteConfirm")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>
              {tCommon("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "..." : tCommon("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
