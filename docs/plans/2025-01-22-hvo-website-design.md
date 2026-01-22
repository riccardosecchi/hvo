# HVO Website Design Document

## Overview

Premium website for HVO, an event organization company specializing in Tech House, House, Latin House, and Techno events.

**Brand Identity:** Logo 04_HVO.jpg - clean minimal design with chevron V and arrow O detail.

---

## Tech Stack

- **Framework:** Next.js 14 (App Router, Server Components)
- **Styling:** Tailwind CSS + shadcn/ui
- **Animation:** Framer Motion
- **Icons:** Lucide React
- **Backend:** Supabase (Auth, PostgreSQL, Storage)
- **i18n:** next-intl (Italian/English)
- **Deployment:** Vercel

---

## Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| background | #0A0A0F | Page background |
| primary | #00E5FF | Buttons, accents, links |
| secondary | #E91E8C | Highlights, gradients |
| foreground | #FFFFFF | Primary text |
| muted | #71717A | Secondary text |

---

## Folder Structure

```
/app
  /[locale]               # i18n routing (it/en)
    /page.tsx             # Public homepage
    /admin
      /login/page.tsx
      /dashboard/page.tsx
      /events/page.tsx
      /users/page.tsx
/components
  /ui                     # shadcn components
  /events                 # Event card, list
  /admin                  # Dashboard components
  /layout                 # Header, Footer, LangToggle
/lib
  /supabase.ts            # Client & server clients
  /i18n.ts                # Translation config
/messages
  /en.json                # English translations
  /it.json                # Italian translations
/public
  /logos                  # Logo assets
```

---

## Database Schema

### Table: `events`

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key (gen_random_uuid()) |
| created_at | timestamptz | Auto-generated |
| name | text | Event name |
| date | date | Event date |
| time | time | Event time |
| location | text | Venue name |
| image_url | text | Supabase Storage URL |
| booking_link | text | External booking URL |
| is_active | boolean | Show on homepage (default: false) |
| is_booking_open | boolean | Show booking button (default: false) |

### Table: `admin_invites`

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| created_at | timestamptz | Auto-generated |
| email | text | Invited email |
| invitation_token | text | Unique token for registration URL |
| is_confirmed | boolean | Master admin approval (default: false) |
| invited_by | uuid | FK to auth.users |

### Table: `profiles`

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | FK to auth.users |
| email | text | User email |
| is_master_admin | boolean | Only true for master admin |
| created_at | timestamptz | Auto-generated |

### Row Level Security

- `events`: Public read (where is_active = true), admin-only write
- `admin_invites`: Admin-only read/write
- `profiles`: Users read own, master admin reads all

---

## Public Pages

### Header
- Sticky, glassmorphism effect (`backdrop-blur-md bg-black/50`)
- Logo left (~40px height)
- Language toggle right (IT/EN pill switcher)

### Hero Section
- Full viewport mobile, ~70vh desktop
- Logo centered, animates scale (0.8→1, 0.6s)
- "HVO events" tagline fades in (0.3s delay)
- Subtle cyan glow pulse on logo
- Scroll indicator (bouncing chevron)

### Events Feed
- Section title: "Eventi" / "Events"
- Vertical stack, full-width cards
- Card structure:
  - Event image (16:9, lazy loaded, blur placeholder)
  - Gradient overlay (transparent → black)
  - Event name (bold), Location, Date + Time
  - "Prenotati" / "Book Now" button (if is_booking_open)
  - Button: Cyan bg, black text, hover glow
- Cards animate on scroll (fade up + scale, stagger 0.1s)
- Empty state message when no events

### Footer
- Minimal: Small logo, copyright "© 2025 HVO events"

---

## Admin Dashboard

### Login (`/admin/login`)
- Centered card, dark background
- Logo, email/password fields, sign in button
- Error states with red accent

### Layout
- Sidebar navigation (hamburger on mobile)
- Nav: Dashboard, Eventi, Utenti, Profilo
- Dark theme consistent with public site

### Events Management (`/admin/events`)
- Table view: thumbnail, name, date, location, toggles, actions
- "Nuovo Evento" button
- Event form: image upload, name, location, date/time pickers, booking link, toggles
- Edit/Delete with confirmation

### User Management (`/admin/users`)
- Invite: Email input → generate copyable registration URL
- Pending invites list
- Confirmed admins list
- Master admin can confirm pending users

### Profile (`/admin/profile`)
- Display email (read-only)
- Change password form

---

## Authentication Flow

1. Master admin seeded: riccardosecchi1@gmail.com / testprova1234
2. Invite flow: Generate token → share URL → register → pending → master confirms → active
3. Middleware protects all `/admin/*` routes
4. Supabase Auth with JWT cookies

---

## Animations

- Hero logo: scale 0.8→1 + fade (0.6s)
- Hero tagline: fade in (0.3s delay)
- Event cards: whileInView, translateY(20→0) + opacity, stagger 0.1s
- Buttons: scale 1.02 on hover, glow increase
- All animations: 0.3-0.5s, ease-out

---

## Technical Requirements

### Image Handling
- Supabase Storage for uploads
- Next.js Image with blur placeholder
- WebP preferred, 1200px max width

### SEO & Performance
- Server Components for events
- Dynamic metadata per locale
- OpenGraph images
- Semantic HTML
- Target: 90+ Lighthouse

### Security
- RLS on all tables
- Middleware route protection
- Input sanitization
- Supabase rate limiting

---

## Master Admin Credentials

- Email: riccardosecchi1@gmail.com
- Password: testprova1234

---

## Localization

Bilingual support (Italian default, English toggle):
- UI labels, buttons, messages
- Date/time formatting per locale
- SEO metadata per locale
