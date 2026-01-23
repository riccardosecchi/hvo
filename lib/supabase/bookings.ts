import { createClient } from "./client";
import type { EventBookingField, EventBooking, BookingFieldConfig } from "../database.types";

// ============================================
// BOOKING FIELDS (Form Configuration)
// ============================================

export async function getEventBookingFields(eventId: string): Promise<EventBookingField[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from("event_booking_fields")
        .select("*")
        .eq("event_id", eventId)
        .order("field_order", { ascending: true });

    if (error) throw error;
    return data || [];
}

export async function saveEventBookingFields(
    eventId: string,
    fields: BookingFieldConfig[]
): Promise<void> {
    const supabase = createClient();

    // Delete existing fields
    await supabase
        .from("event_booking_fields")
        .delete()
        .eq("event_id", eventId);

    // Insert new fields
    if (fields.length > 0) {
        const fieldsToInsert = fields.map((field, index) => ({
            event_id: eventId,
            field_name: field.field_name,
            field_label: field.field_label,
            field_type: field.field_type,
            field_options: field.field_options || [],
            is_required: field.is_required,
            field_order: index,
        }));

        const { error } = await supabase
            .from("event_booking_fields")
            .insert(fieldsToInsert);

        if (error) throw error;
    }
}

// ============================================
// BOOKINGS (User Submissions)
// ============================================

export async function createBooking(
    eventId: string,
    bookingData: Record<string, string>
): Promise<EventBooking> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from("event_bookings")
        .insert({
            event_id: eventId,
            booking_data: bookingData,
            status: "pending",
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getEventBookings(
    eventId: string,
    statusFilter?: "pending" | "approved" | "rejected"
): Promise<EventBooking[]> {
    const supabase = createClient();

    let query = supabase
        .from("event_bookings")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });

    if (statusFilter) {
        query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
}

export async function updateBookingStatus(
    bookingId: string,
    status: "approved" | "rejected",
    notes?: string
): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
        .from("event_bookings")
        .update({
            status,
            notes: notes || null,
            reviewed_at: new Date().toISOString(),
        })
        .eq("id", bookingId);

    if (error) throw error;
}

export async function deleteBooking(bookingId: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
        .from("event_bookings")
        .delete()
        .eq("id", bookingId);

    if (error) throw error;
}

// ============================================
// STATS
// ============================================

export async function getBookingStats(eventId: string): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
}> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from("event_bookings")
        .select("status")
        .eq("event_id", eventId);

    if (error) throw error;

    const bookings = data || [];
    return {
        total: bookings.length,
        pending: bookings.filter((b) => b.status === "pending").length,
        approved: bookings.filter((b) => b.status === "approved").length,
        rejected: bookings.filter((b) => b.status === "rejected").length,
    };
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

export async function exportBookingsToJSON(
    eventId: string,
    onlyApproved: boolean = true
): Promise<string> {
    const bookings = await getEventBookings(
        eventId,
        onlyApproved ? "approved" : undefined
    );

    const exportData = bookings.map((b) => ({
        ...b.booking_data,
        _id: b.id,
        _status: b.status,
        _created_at: b.created_at,
    }));

    return JSON.stringify(exportData, null, 2);
}

export async function exportBookingsToCSV(
    eventId: string,
    fields: EventBookingField[],
    onlyApproved: boolean = true
): Promise<string> {
    const bookings = await getEventBookings(
        eventId,
        onlyApproved ? "approved" : undefined
    );

    if (bookings.length === 0) return "";

    // Create header row
    const headers = fields.map((f) => f.field_label);
    headers.push("Status", "Data Prenotazione");

    // Create data rows
    const rows = bookings.map((booking) => {
        const row = fields.map((f) => {
            const value = booking.booking_data[f.field_name] || "";
            // Escape quotes and wrap in quotes if contains comma
            if (value.includes(",") || value.includes('"')) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        });
        row.push(booking.status);
        row.push(new Date(booking.created_at).toLocaleString("it-IT"));
        return row.join(",");
    });

    return [headers.join(","), ...rows].join("\n");
}

// Helper to trigger download
export function downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
