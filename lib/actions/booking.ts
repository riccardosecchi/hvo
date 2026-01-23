'use server';

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { checkHoneypot, sanitizeBookingData } from '@/lib/security/sanitize';
import {
    checkBookingRateLimit,
    recordBookingAttempt,
    getClientIp,
} from '@/lib/security/rate-limiter';

export interface BookingResult {
    success: boolean;
    error?: string;
    bookingId?: string;
}

/**
 * Server action to submit a booking with full security checks
 */
export async function submitBooking(formData: FormData): Promise<BookingResult> {
    // Get headers for IP extraction
    const headersList = await headers();
    const clientIp = getClientIp(headersList);

    // Extract form data
    const eventId = formData.get('eventId') as string;

    if (!eventId) {
        return { success: false, error: 'ID evento mancante' };
    }

    // 1. HONEYPOT CHECK
    // If honeypot is filled, return fake success (don't reveal detection)
    if (checkHoneypot(formData)) {
        console.log(`[SECURITY] Honeypot triggered from IP: ${clientIp}`);
        // Fake success to confuse bots
        return { success: true, bookingId: 'fake-' + Date.now() };
    }

    // 2. RATE LIMIT CHECK
    const rateLimitResult = await checkBookingRateLimit(clientIp, eventId);

    if (!rateLimitResult.allowed) {
        console.log(`[SECURITY] Rate limit exceeded for IP: ${clientIp}`);
        return {
            success: false,
            error: 'Troppe richieste. Riprova tra un\'ora.',
        };
    }

    // 3. GET EVENT AND BOOKING FIELDS
    const supabase = await createClient();

    // Verify event exists and booking is open
    const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id, booking_type, is_booking_open, is_active')
        .eq('id', eventId)
        .single();

    if (eventError || !event) {
        return { success: false, error: 'Evento non trovato' };
    }

    if (!event.is_active || !event.is_booking_open) {
        return { success: false, error: 'Le prenotazioni per questo evento sono chiuse' };
    }

    if (event.booking_type !== 'internal') {
        return { success: false, error: 'Questo evento usa prenotazioni esterne' };
    }

    // Get booking fields for validation
    const { data: fields } = await supabase
        .from('event_booking_fields')
        .select('field_name, field_type, field_label, is_required')
        .eq('event_id', eventId);

    if (!fields || fields.length === 0) {
        return { success: false, error: 'Configurazione form non trovata' };
    }

    // 4. EXTRACT AND SANITIZE BOOKING DATA
    const bookingData: Record<string, string> = {};
    const fieldTypes: Record<string, string> = {};

    for (const field of fields) {
        const value = formData.get(field.field_name);
        bookingData[field.field_name] = String(value || '');
        fieldTypes[field.field_name] = field.field_type;
    }

    // Sanitize all inputs
    const sanitizeResult = sanitizeBookingData(bookingData, fieldTypes);

    if (!sanitizeResult.valid) {
        return {
            success: false,
            error: sanitizeResult.errors.join('. '),
        };
    }

    // 5. VALIDATE REQUIRED FIELDS
    for (const field of fields) {
        if (field.is_required) {
            const value = sanitizeResult.data[field.field_name]?.trim();
            if (!value) {
                return {
                    success: false,
                    error: `Il campo "${field.field_label}" è obbligatorio`,
                };
            }
        }
    }

    // 6. CHECK FOR DUPLICATE BOOKING (same email for same event)
    const email = sanitizeResult.data['email'] || sanitizeResult.data['Email'];

    if (email) {
        const { data: existingBooking } = await supabase
            .from('event_bookings')
            .select('id')
            .eq('event_id', eventId)
            .eq('booking_data->>email', email)
            .maybeSingle();

        if (existingBooking) {
            return {
                success: false,
                error: 'Esiste già una prenotazione con questa email per questo evento',
            };
        }
    }

    // 7. RECORD RATE LIMIT ATTEMPT
    await recordBookingAttempt(clientIp, eventId);

    // 8. CREATE BOOKING
    const { data: booking, error: bookingError } = await supabase
        .from('event_bookings')
        .insert({
            event_id: eventId,
            booking_data: sanitizeResult.data,
            status: 'pending',
            ip_address: clientIp,
        })
        .select('id')
        .single();

    if (bookingError) {
        console.error('[BOOKING] Error creating booking:', bookingError);

        // Check if it's a duplicate constraint violation
        if (bookingError.code === '23505') {
            return {
                success: false,
                error: 'Esiste già una prenotazione con questa email per questo evento',
            };
        }

        return { success: false, error: 'Errore durante la prenotazione. Riprova.' };
    }

    console.log(`[BOOKING] New booking created: ${booking.id} from IP: ${clientIp}`);

    return {
        success: true,
        bookingId: booking.id,
    };
}
