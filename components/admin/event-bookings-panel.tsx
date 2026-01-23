"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Check,
    X,
    Download,
    FileJson,
    FileSpreadsheet,
    Loader2,
    Users,
    Clock,
    CheckCircle,
    XCircle,
} from "lucide-react";
import type { EventBooking, EventBookingField } from "@/lib/database.types";
import {
    getEventBookings,
    getEventBookingFields,
    updateBookingStatus,
    exportBookingsToJSON,
    exportBookingsToCSV,
    downloadFile,
} from "@/lib/supabase/bookings";

interface EventBookingsPanelProps {
    eventId: string;
    eventName: string;
}

type StatusFilter = "all" | "pending" | "approved" | "rejected";

export function EventBookingsPanel({ eventId, eventName }: EventBookingsPanelProps) {
    const [bookings, setBookings] = useState<EventBooking[]>([]);
    const [fields, setFields] = useState<EventBookingField[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [filter, setFilter] = useState<StatusFilter>("all");

    useEffect(() => {
        loadData();
    }, [eventId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [bookingsData, fieldsData] = await Promise.all([
                getEventBookings(eventId),
                getEventBookingFields(eventId),
            ]);
            setBookings(bookingsData);
            setFields(fieldsData);
        } catch (error) {
            console.error("Error loading bookings:", error);
        }
        setLoading(false);
    };

    const handleUpdateStatus = async (
        bookingId: string,
        status: "approved" | "rejected"
    ) => {
        setActionLoading(bookingId);
        try {
            await updateBookingStatus(bookingId, status);
            setBookings((prev) =>
                prev.map((b) =>
                    b.id === bookingId
                        ? { ...b, status, reviewed_at: new Date().toISOString() }
                        : b
                )
            );
        } catch (error) {
            console.error("Error updating booking:", error);
        }
        setActionLoading(null);
    };

    const handleExportJSON = async () => {
        try {
            const json = await exportBookingsToJSON(eventId, true);
            downloadFile(json, `${eventName}_bookings.json`, "application/json");
        } catch (error) {
            console.error("Error exporting JSON:", error);
        }
    };

    const handleExportCSV = async () => {
        try {
            const csv = await exportBookingsToCSV(eventId, fields, true);
            downloadFile(csv, `${eventName}_bookings.csv`, "text/csv");
        } catch (error) {
            console.error("Error exporting CSV:", error);
        }
    };

    const filteredBookings = bookings.filter((b) =>
        filter === "all" ? true : b.status === filter
    );

    const stats = {
        total: bookings.length,
        pending: bookings.filter((b) => b.status === "pending").length,
        approved: bookings.filter((b) => b.status === "approved").length,
        rejected: bookings.filter((b) => b.status === "rejected").length,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-[var(--accent)] animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-[var(--surface-1)] border border-white/[0.06]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-white/5">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{stats.total}</p>
                            <p className="text-xs text-[var(--text-muted)]">Totale</p>
                        </div>
                    </div>
                </div>
                <div className="p-4 rounded-lg bg-[var(--surface-1)] border border-white/[0.06]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-yellow-500/10">
                            <Clock className="w-5 h-5 text-yellow-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
                            <p className="text-xs text-[var(--text-muted)]">In attesa</p>
                        </div>
                    </div>
                </div>
                <div className="p-4 rounded-lg bg-[var(--surface-1)] border border-white/[0.06]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-green-500/10">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-500">{stats.approved}</p>
                            <p className="text-xs text-[var(--text-muted)]">Approvati</p>
                        </div>
                    </div>
                </div>
                <div className="p-4 rounded-lg bg-[var(--surface-1)] border border-white/[0.06]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-red-500/10">
                            <XCircle className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-red-500">{stats.rejected}</p>
                            <p className="text-xs text-[var(--text-muted)]">Rifiutati</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Filters */}
                <div className="flex gap-2">
                    {(["all", "pending", "approved", "rejected"] as StatusFilter[]).map(
                        (status) => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === status
                                        ? "bg-[var(--accent)] text-white"
                                        : "bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-white"
                                    }`}
                            >
                                {status === "all" && "Tutti"}
                                {status === "pending" && "In attesa"}
                                {status === "approved" && "Approvati"}
                                {status === "rejected" && "Rifiutati"}
                            </button>
                        )
                    )}
                </div>

                {/* Export Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={handleExportJSON}
                        disabled={stats.approved === 0}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-[var(--surface-2)] text-[var(--text-secondary)] rounded-md hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FileJson className="w-4 h-4" />
                        Export JSON
                    </button>
                    <button
                        onClick={handleExportCSV}
                        disabled={stats.approved === 0}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-[var(--surface-2)] text-[var(--text-secondary)] rounded-md hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                        Export Excel
                    </button>
                </div>
            </div>

            {/* Bookings Table */}
            {filteredBookings.length === 0 ? (
                <div className="text-center py-12 text-[var(--text-muted)]">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nessuna prenotazione {filter !== "all" && "con questo filtro"}</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/[0.06]">
                                {fields.map((field) => (
                                    <th
                                        key={field.id}
                                        className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider"
                                    >
                                        {field.field_label}
                                    </th>
                                ))}
                                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                                    Data
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                                    Azioni
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                            <AnimatePresence>
                                {filteredBookings.map((booking) => (
                                    <motion.tr
                                        key={booking.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="hover:bg-white/[0.02] transition-colors"
                                    >
                                        {fields.map((field) => (
                                            <td
                                                key={field.id}
                                                className="px-4 py-4 text-sm text-white"
                                            >
                                                {booking.booking_data[field.field_name] || "-"}
                                            </td>
                                        ))}
                                        <td className="px-4 py-4">
                                            <span
                                                className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${booking.status === "pending"
                                                        ? "bg-yellow-500/10 text-yellow-500"
                                                        : booking.status === "approved"
                                                            ? "bg-green-500/10 text-green-500"
                                                            : "bg-red-500/10 text-red-500"
                                                    }`}
                                            >
                                                {booking.status === "pending" && <Clock className="w-3 h-3" />}
                                                {booking.status === "approved" && <CheckCircle className="w-3 h-3" />}
                                                {booking.status === "rejected" && <XCircle className="w-3 h-3" />}
                                                {booking.status === "pending" && "In attesa"}
                                                {booking.status === "approved" && "Approvato"}
                                                {booking.status === "rejected" && "Rifiutato"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-[var(--text-muted)]">
                                            {new Date(booking.created_at).toLocaleDateString("it-IT")}
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            {booking.status === "pending" && (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleUpdateStatus(booking.id, "approved")}
                                                        disabled={actionLoading === booking.id}
                                                        className="p-2 rounded-md bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                                                        title="Approva"
                                                    >
                                                        {actionLoading === booking.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Check className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateStatus(booking.id, "rejected")}
                                                        disabled={actionLoading === booking.id}
                                                        className="p-2 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                                        title="Rifiuta"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
