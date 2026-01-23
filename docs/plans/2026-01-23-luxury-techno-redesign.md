# HVO Luxury Techno Redesign

**Date**: 2026-01-23
**Status**: Approved
**Reference**: Resident Advisor, Cercle, Linear

---

## Design Decisions

| Decision | Choice |
|----------|--------|
| Accent Color | Electric Blue (#0066FF) |
| Event Cards | Full-width 16:9, vertical stack |
| Admin Style | Clean dashboard, SaaS aesthetic |

---

## 1. Design System

### Colors

```css
:root {
  /* Backgrounds */
  --black: #000000;
  --surface-1: #0A0A0A;
  --surface-2: #141414;
  --surface-3: #1A1A1A;

  /* Accent */
  --accent: #0066FF;
  --accent-hover: #0052CC;
  --accent-glow: rgba(0, 102, 255, 0.4);

  /* Text */
  --text-primary: #FFFFFF;
  --text-secondary: #888888;
  --text-muted: #555555;

  /* Borders */
  --border: rgba(255, 255, 255, 0.1);
  --border-hover: rgba(255, 255, 255, 0.2);
}
```

### Typography

- **Display**: Inter (700 weight for headings)
- **Body**: Inter (400, 500 weights)
- **Scale**: Based on 4px grid (4, 8, 12, 16, 24, 32, 48, 64, 96)

### Principles

- No gradients except subtle image overlays
- Single accent color - blue appears sparingly
- White text on black, blue only for interactive elements
- Generous whitespace
- Borders: 1px solid rgba(255,255,255,0.1)

---

## 2. Event Card Component

### Structure

```
┌─────────────────────────────────────────┐
│                                         │
│            16:9 IMAGE                   │
│         (object-cover, zoom)            │
│                                         │
├─────────────────────────────────────────┤
│  VENUE              23 MAR 2025         │
│  Event Title                            │
│  ┌────────────┐                         │
│  │ PRENOTA →  │                         │
│  └────────────┘                         │
└─────────────────────────────────────────┘
```

### Interactions

- **Image**: `scale(1.05)` on hover, `transition: 0.6s ease`
- **Card**: Border glow `0 0 0 1px rgba(0,102,255,0.3)` on hover
- **Button**: Ghost style → hover adds `box-shadow: 0 0 20px var(--accent-glow)`

### Typography

- Venue: 12px uppercase, tracking-widest, text-secondary
- Title: 32px (mobile: 24px), font-medium, text-primary
- Date: 14px, tabular-nums, text-secondary

### Spacing

- Card padding: 24px (mobile: 16px)
- Gap between cards: 48px (mobile: 32px)
- Image-to-content gap: 24px

---

## 3. Hero & Navigation

### Header

- Height: 64px (mobile: 56px)
- Background: transparent → `rgba(0,0,0,0.9)` + `backdrop-blur(12px)` on scroll
- Logo: 32px, clean, no effects
- Language: Simple "IT / EN" text toggle
- Admin: Text link or subtle indicator

### Hero

- Full viewport height (100vh)
- Logo: 120px centered
- "HVO": 64px uppercase, letter-spacing: 0.3em
- Tagline: 14px uppercase, tracking-widest, text-secondary
- No animated orbs - pure black with subtle vignette
- Scroll indicator: Simple animated chevron

### Animation

- Staggered fade-in over 1.2s total
- Logo → Title → Tagline → Scroll indicator

---

## 4. Admin Dashboard

### Layout

```
┌──────────┬──────────────────────────────┐
│ Sidebar  │  Main Content                │
│ 256px    │                              │
│          │  Stats Row                   │
│ - Logo   │  ┌─────┐ ┌─────┐ ┌─────┐    │
│ - Nav    │  │ 12  │ │  8  │ │  2  │    │
│ - Logout │  └─────┘ └─────┘ └─────┘    │
│          │                              │
│          │  Content Area                │
└──────────┴──────────────────────────────┘
```

### Surfaces

- Sidebar: #0A0A0A, 1px right border
- Main: #000000
- Cards: #0A0A0A, 1px border, 8px radius
- Inputs: #0A0A0A, focus: blue border

### Components

- Stat Cards: Large number (32px), small label (12px)
- Tables: No zebra, hover: #141414
- Buttons: Primary = solid blue, Secondary = ghost
- Toasts: Sonner, bottom-right, dark theme

### Mobile

- Sidebar becomes bottom tab bar
- 4 icons: Dashboard, Events, Users, Profile

---

## 5. Loading & Animation

### Skeleton Loaders

- Shimmer gradient: #0A0A0A → #141414 → #0A0A0A
- Animation: 1.5s translateX loop

### Page Transitions

- Route: Fade 0.2s out, 0.3s in
- Cards: Staggered scroll reveal, 0.1s delay per card

### Toasts (Sonner)

- Success: Green left accent
- Error: Red left accent
- Position: Bottom-right
- Duration: 4s

---

## 6. Technical Requirements

### Stack

- Tailwind CSS only (remove custom CSS classes)
- Shadcn/UI: Button, Input, Dialog, Switch, Table, Sonner
- Framer Motion for animations
- Next.js Image with sizes prop

### Accessibility

- Touch targets: 44px minimum
- Focus: ring-2 ring-blue-500 ring-offset-2 ring-offset-black
- Respect prefers-reduced-motion

### Files to Refactor

1. `app/globals.css` - Strip to minimal, new color system
2. `app/[locale]/page.tsx` - New hero + events layout
3. `app/[locale]/layout.tsx` - Clean header/footer
4. `components/events/event-card.tsx` - 16:9 vertical cards
5. `components/home/hero.tsx` - Minimal hero
6. `components/layout/header.tsx` - Clean navigation
7. `components/admin/*` - Dashboard overhaul
8. Add: `components/ui/skeleton.tsx` - Loading states

---

## 7. Implementation Order

1. Design system (globals.css, tailwind config)
2. Header component
3. Hero component
4. Event card component
5. Events list + skeletons
6. Admin sidebar
7. Admin dashboard
8. Admin forms + toasts
9. Final polish + testing
