# Booking Security Design

## Overview

Implementazione di protezioni anti-bot e anti-spam per il form di prenotazione eventi, senza dipendenze esterne.

## Architettura

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Booking Form   │────▶│  Server Action   │────▶│  Supabase   │
│  (client)       │     │  (validazione)   │     │  (database) │
└─────────────────┘     └──────────────────┘     └─────────────┘
        │                        │
        ▼                        ▼
   Honeypot fields         Rate Limiter
   (hidden traps)          (IP tracking)
```

## Componenti

### 1. Honeypot Fields
- 2 campi nascosti con CSS (`position:absolute;left:-9999px`)
- Nomi allettanti per bot: `website`, `phone_confirm`
- Se compilati → richiesta rifiutata silenziosamente (fake success)

### 2. Rate Limiter
- Tabella `booking_rate_limits` traccia IP + event_id + timestamp
- Limite: 3 prenotazioni / ora / IP / evento
- Auto-cleanup record > 24 ore

### 3. Server Action
- Tutta la logica di creazione booking lato server
- Non bypassabile dal client

### 4. Duplicate Prevention
- Indice unique su (event_id, email)
- Stessa email non può prenotare 2 volte stesso evento

### 5. Input Sanitization
- Email: regex + lowercase + trim
- Telefono: solo numeri, +, spazi
- Testi: max 1000 chars, escape HTML
- Tutti: trim whitespace

## File Structure

```
lib/
  actions/
    booking.ts          ← Server Action
  security/
    rate-limiter.ts     ← Rate limiting
    sanitize.ts         ← Input sanitization

app/[locale]/events/[id]/book/
    page.tsx            ← Honeypot fields

supabase/migrations/
    004_security.sql    ← Rate limits table
```

## Database Schema

### Nuova tabella: `booking_rate_limits`
```sql
CREATE TABLE public.booking_rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address TEXT NOT NULL,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_rate_limits_ip_event_time
ON public.booking_rate_limits(ip_address, event_id, created_at DESC);
```

### Modifica: `event_bookings`
```sql
ALTER TABLE public.event_bookings
ADD COLUMN IF NOT EXISTS ip_address TEXT;

CREATE UNIQUE INDEX idx_bookings_email_event
ON public.event_bookings(event_id, (booking_data->>'email'))
WHERE booking_data->>'email' IS NOT NULL;
```

## Flow

1. **Render Form**: campi normali + 2 honeypot nascosti
2. **Submit → Server Action**:
   - Check honeypot → se filled, fake success
   - Check rate limit → se >= 3/ora, reject
   - Check duplicate → se email già usata, reject
   - Sanitize & validate inputs
   - Insert booking + rate limit record
3. **Response**: success o errore specifico

## Security Notes

- Honeypot rejection = fake success (bot non sanno di essere bloccati)
- Rate limit usa IP da headers (`x-forwarded-for`)
- Tutti i check sono server-side (non bypassabili)
- RLS policies proteggono accesso diretto a rate_limits

## Approved

Design approvato il 2026-01-23.
