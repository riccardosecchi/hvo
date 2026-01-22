# HVO Website Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a premium bilingual website for HVO events with public event listings and admin dashboard.

**Architecture:** Next.js App Router with locale-based routing (`/[locale]/`), Supabase for auth/database/storage, server components for data fetching, client components for interactivity.

**Tech Stack:** Next.js 14, Tailwind CSS, shadcn/ui, Framer Motion, Lucide React, Supabase, next-intl

---

## Phase 1: Project Foundation

### Task 1: Initialize Next.js Project

**Files:**
- Create: `package.json`
- Create: `next.config.js`
- Create: `tailwind.config.ts`
- Create: `tsconfig.json`

**Step 1: Create Next.js app with TypeScript and Tailwind**

Run:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm
```

Expected: Project scaffolded with app directory

**Step 2: Verify installation**

Run:
```bash
npm run dev
```

Expected: Server starts on localhost:3000

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: initialize Next.js project with TypeScript and Tailwind"
```

---

### Task 2: Configure Tailwind with HVO Theme

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `app/globals.css`

**Step 1: Update Tailwind config with HVO colors**

Replace `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0A0A0F",
        foreground: "#FFFFFF",
        primary: {
          DEFAULT: "#00E5FF",
          foreground: "#0A0A0F",
        },
        secondary: {
          DEFAULT: "#E91E8C",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#1A1A2E",
          foreground: "#71717A",
        },
        card: {
          DEFAULT: "#0F0F1A",
          foreground: "#FFFFFF",
        },
        border: "#2A2A3E",
        input: "#1A1A2E",
        ring: "#00E5FF",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      animation: {
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "bounce-slow": "bounce 2s infinite",
      },
      keyframes: {
        "glow-pulse": {
          "0%, 100%": {
            boxShadow: "0 0 20px rgba(0, 229, 255, 0.3)",
          },
          "50%": {
            boxShadow: "0 0 40px rgba(0, 229, 255, 0.6)",
          },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
```

**Step 2: Update global CSS**

Replace `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 240 10% 4%;
    --foreground: 0 0% 100%;
    --primary: 187 100% 50%;
    --primary-foreground: 240 10% 4%;
    --secondary: 330 85% 52%;
    --secondary-foreground: 0 0% 100%;
    --muted: 240 10% 14%;
    --muted-foreground: 240 4% 46%;
    --card: 240 10% 8%;
    --card-foreground: 0 0% 100%;
    --border: 240 10% 20%;
    --input: 240 10% 14%;
    --ring: 187 100% 50%;
    --radius: 0.5rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground antialiased;
  }
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #0A0A0F;
}

::-webkit-scrollbar-thumb {
  background: #2A2A3E;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #3A3A4E;
}
```

**Step 3: Install tailwindcss-animate**

Run:
```bash
npm install tailwindcss-animate
```

**Step 4: Verify by checking dev server**

Run:
```bash
npm run dev
```

Expected: Page loads with dark background (#0A0A0F)

**Step 5: Commit**

```bash
git add tailwind.config.ts app/globals.css package.json package-lock.json
git commit -m "style: configure Tailwind with HVO dark theme"
```

---

### Task 3: Install and Configure shadcn/ui

**Files:**
- Create: `components.json`
- Create: `lib/utils.ts`
- Create: `components/ui/button.tsx`
- Create: `components/ui/input.tsx`
- Create: `components/ui/label.tsx`
- Create: `components/ui/card.tsx`
- Create: `components/ui/switch.tsx`
- Create: `components/ui/dialog.tsx`

**Step 1: Initialize shadcn/ui**

Run:
```bash
npx shadcn@latest init
```

When prompted:
- Style: Default
- Base color: Neutral
- CSS variables: Yes

**Step 2: Install required components**

Run:
```bash
npx shadcn@latest add button input label card switch dialog dropdown-menu table toast
```

**Step 3: Verify button renders**

Temporarily add to `app/page.tsx`:

```tsx
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <Button>Test Button</Button>
    </main>
  );
}
```

Run: `npm run dev`
Expected: Cyan button visible on dark background

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: add shadcn/ui with core components"
```

---

### Task 4: Install Additional Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install Framer Motion, Lucide, and Supabase**

Run:
```bash
npm install framer-motion lucide-react @supabase/supabase-js @supabase/ssr next-intl
```

**Step 2: Verify package.json has all dependencies**

Run:
```bash
cat package.json | grep -E "framer-motion|lucide-react|supabase|next-intl"
```

Expected: All four packages listed

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add framer-motion, lucide, supabase, next-intl"
```

---

## Phase 2: Internationalization Setup

### Task 5: Configure next-intl

**Files:**
- Create: `i18n/request.ts`
- Create: `i18n/routing.ts`
- Create: `messages/en.json`
- Create: `messages/it.json`
- Create: `middleware.ts`
- Modify: `next.config.js`

**Step 1: Create i18n routing config**

Create `i18n/routing.ts`:

```typescript
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["it", "en"],
  defaultLocale: "it",
});
```

**Step 2: Create i18n request config**

Create `i18n/request.ts`:

```typescript
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

**Step 3: Create Italian translations**

Create `messages/it.json`:

```json
{
  "common": {
    "loading": "Caricamento...",
    "error": "Si è verificato un errore",
    "save": "Salva",
    "cancel": "Annulla",
    "delete": "Elimina",
    "edit": "Modifica",
    "confirm": "Conferma",
    "back": "Indietro"
  },
  "nav": {
    "events": "Eventi",
    "admin": "Admin"
  },
  "hero": {
    "tagline": "HVO events"
  },
  "events": {
    "title": "Eventi",
    "book": "Prenotati",
    "noEvents": "Nessun evento in programma",
    "location": "Luogo",
    "date": "Data",
    "time": "Ora"
  },
  "footer": {
    "copyright": "© 2025 HVO events"
  },
  "admin": {
    "login": {
      "title": "Accedi",
      "email": "Email",
      "password": "Password",
      "submit": "Accedi",
      "error": "Credenziali non valide"
    },
    "nav": {
      "dashboard": "Dashboard",
      "events": "Eventi",
      "users": "Utenti",
      "profile": "Profilo",
      "logout": "Esci"
    },
    "events": {
      "title": "Gestione Eventi",
      "new": "Nuovo Evento",
      "name": "Nome Evento",
      "location": "Luogo",
      "date": "Data",
      "time": "Ora",
      "bookingLink": "Link Prenotazione",
      "isActive": "Evento Attivo",
      "isBookingOpen": "Prenotazioni Aperte",
      "image": "Immagine",
      "uploadImage": "Carica Immagine",
      "deleteConfirm": "Sei sicuro di voler eliminare questo evento?"
    },
    "users": {
      "title": "Gestione Utenti",
      "invite": "Invita Admin",
      "generateLink": "Genera Link",
      "copyLink": "Copia Link",
      "pending": "In Attesa di Conferma",
      "confirmed": "Admin Confermati",
      "confirmUser": "Conferma",
      "linkCopied": "Link copiato!"
    },
    "profile": {
      "title": "Profilo",
      "changePassword": "Cambia Password",
      "currentPassword": "Password Attuale",
      "newPassword": "Nuova Password",
      "confirmPassword": "Conferma Password",
      "passwordChanged": "Password aggiornata con successo"
    }
  }
}
```

**Step 4: Create English translations**

Create `messages/en.json`:

```json
{
  "common": {
    "loading": "Loading...",
    "error": "An error occurred",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "confirm": "Confirm",
    "back": "Back"
  },
  "nav": {
    "events": "Events",
    "admin": "Admin"
  },
  "hero": {
    "tagline": "HVO events"
  },
  "events": {
    "title": "Events",
    "book": "Book Now",
    "noEvents": "No upcoming events",
    "location": "Location",
    "date": "Date",
    "time": "Time"
  },
  "footer": {
    "copyright": "© 2025 HVO events"
  },
  "admin": {
    "login": {
      "title": "Sign In",
      "email": "Email",
      "password": "Password",
      "submit": "Sign In",
      "error": "Invalid credentials"
    },
    "nav": {
      "dashboard": "Dashboard",
      "events": "Events",
      "users": "Users",
      "profile": "Profile",
      "logout": "Sign Out"
    },
    "events": {
      "title": "Event Management",
      "new": "New Event",
      "name": "Event Name",
      "location": "Location",
      "date": "Date",
      "time": "Time",
      "bookingLink": "Booking Link",
      "isActive": "Event Active",
      "isBookingOpen": "Bookings Open",
      "image": "Image",
      "uploadImage": "Upload Image",
      "deleteConfirm": "Are you sure you want to delete this event?"
    },
    "users": {
      "title": "User Management",
      "invite": "Invite Admin",
      "generateLink": "Generate Link",
      "copyLink": "Copy Link",
      "pending": "Pending Confirmation",
      "confirmed": "Confirmed Admins",
      "confirmUser": "Confirm",
      "linkCopied": "Link copied!"
    },
    "profile": {
      "title": "Profile",
      "changePassword": "Change Password",
      "currentPassword": "Current Password",
      "newPassword": "New Password",
      "confirmPassword": "Confirm Password",
      "passwordChanged": "Password updated successfully"
    }
  }
}
```

**Step 5: Create middleware for i18n routing**

Create `middleware.ts`:

```typescript
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: ["/", "/(it|en)/:path*"],
};
```

**Step 6: Update next.config.js**

Replace `next.config.ts` with `next.config.mjs`:

```javascript
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
```

Delete `next.config.ts` if it exists:
```bash
rm -f next.config.ts
```

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: configure next-intl with IT/EN translations"
```

---

### Task 6: Restructure App for Locale Routing

**Files:**
- Create: `app/[locale]/layout.tsx`
- Create: `app/[locale]/page.tsx`
- Delete: `app/page.tsx` (move to locale)
- Modify: `app/layout.tsx`

**Step 1: Update root layout**

Replace `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "HVO Events",
  description: "Underground House Events - Tech House, House, Latin House, Techno",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
```

**Step 2: Create locale layout**

Create `app/[locale]/layout.tsx`:

```tsx
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} className="dark">
      <body className={`${inter.variable} font-sans min-h-screen`}>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

**Step 3: Create locale home page**

Create `app/[locale]/page.tsx`:

```tsx
import { useTranslations } from "next-intl";

export default function HomePage() {
  const t = useTranslations("hero");

  return (
    <main className="min-h-screen flex items-center justify-center">
      <h1 className="text-4xl font-bold text-primary">{t("tagline")}</h1>
    </main>
  );
}
```

**Step 4: Delete old page.tsx**

```bash
rm -f app/page.tsx
```

**Step 5: Verify locale routing works**

Run: `npm run dev`

Test:
- `http://localhost:3000` → redirects to `/it`
- `http://localhost:3000/it` → shows "HVO events"
- `http://localhost:3000/en` → shows "HVO events"

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: restructure app for locale-based routing"
```

---

## Phase 3: Supabase Setup

### Task 7: Configure Supabase Client

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/middleware.ts`
- Create: `lib/database.types.ts`
- Create: `.env.local.example`

**Step 1: Create browser client**

Create `lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**Step 2: Create server client**

Create `lib/supabase/server.ts`:

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore - called from Server Component
          }
        },
      },
    }
  );
}
```

**Step 3: Create middleware client**

Create `lib/supabase/middleware.ts`:

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabaseResponse, user };
}
```

**Step 4: Create database types placeholder**

Create `lib/database.types.ts`:

```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          date: string;
          time: string;
          location: string;
          image_url: string | null;
          booking_link: string | null;
          is_active: boolean;
          is_booking_open: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          date: string;
          time: string;
          location: string;
          image_url?: string | null;
          booking_link?: string | null;
          is_active?: boolean;
          is_booking_open?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          date?: string;
          time?: string;
          location?: string;
          image_url?: string | null;
          booking_link?: string | null;
          is_active?: boolean;
          is_booking_open?: boolean;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          is_master_admin: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          is_master_admin?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          is_master_admin?: boolean;
          created_at?: string;
        };
      };
      admin_invites: {
        Row: {
          id: string;
          created_at: string;
          email: string;
          invitation_token: string;
          is_confirmed: boolean;
          invited_by: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          email: string;
          invitation_token: string;
          is_confirmed?: boolean;
          invited_by: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          email?: string;
          invitation_token?: string;
          is_confirmed?: boolean;
          invited_by?: string;
        };
      };
    };
  };
}

export type Event = Database["public"]["Tables"]["events"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type AdminInvite = Database["public"]["Tables"]["admin_invites"]["Row"];
```

**Step 5: Create .env.local.example**

Create `.env.local.example`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Step 6: Add .env.local to .gitignore**

```bash
echo ".env.local" >> .gitignore
```

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add Supabase client configuration"
```

---

### Task 8: Create Supabase Schema Migration

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

**Step 1: Create migration file**

Create directory and file:

```bash
mkdir -p supabase/migrations
```

Create `supabase/migrations/001_initial_schema.sql`:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create events table
CREATE TABLE public.events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  location TEXT NOT NULL,
  image_url TEXT,
  booking_link TEXT,
  is_active BOOLEAN DEFAULT FALSE NOT NULL,
  is_booking_open BOOLEAN DEFAULT FALSE NOT NULL
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  is_master_admin BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create admin_invites table
CREATE TABLE public.admin_invites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  email TEXT NOT NULL UNIQUE,
  invitation_token TEXT NOT NULL UNIQUE,
  is_confirmed BOOLEAN DEFAULT FALSE NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable Row Level Security
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_invites ENABLE ROW LEVEL SECURITY;

-- Events policies
-- Public can read active events
CREATE POLICY "Public can view active events"
  ON public.events
  FOR SELECT
  USING (is_active = TRUE);

-- Authenticated admins can do everything
CREATE POLICY "Admins can manage all events"
  ON public.events
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- Profiles policies
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Master admin can view all profiles
CREATE POLICY "Master admin can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_master_admin = TRUE
    )
  );

-- Users can update their own profile (except is_master_admin)
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admin invites policies
-- Authenticated users can view invites
CREATE POLICY "Admins can view invites"
  ON public.admin_invites
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- Authenticated users can create invites
CREATE POLICY "Admins can create invites"
  ON public.admin_invites
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- Only master admin can update invites (confirm)
CREATE POLICY "Master admin can update invites"
  ON public.admin_invites
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_master_admin = TRUE
    )
  );

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, is_master_admin)
  VALUES (
    NEW.id,
    NEW.email,
    CASE WHEN NEW.email = 'riccardosecchi1@gmail.com' THEN TRUE ELSE FALSE END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for event images
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for public read
CREATE POLICY "Public can view event images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'event-images');

-- Storage policy for authenticated upload
CREATE POLICY "Admins can upload event images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'event-images' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- Storage policy for authenticated delete
CREATE POLICY "Admins can delete event images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'event-images' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
    )
  );
```

**Step 2: Commit migration**

```bash
git add supabase/
git commit -m "feat: add Supabase schema migration with RLS policies"
```

**Step 3: Manual step - Run in Supabase SQL Editor**

> **NOTE:** Copy and run this SQL in your Supabase Dashboard > SQL Editor.
> Then create the master admin user via Authentication > Users > Add User with:
> - Email: riccardosecchi1@gmail.com
> - Password: testprova1234

---

## Phase 4: Layout Components

### Task 9: Create Header Component

**Files:**
- Create: `components/layout/header.tsx`
- Create: `components/layout/language-toggle.tsx`

**Step 1: Create language toggle**

Create `components/layout/language-toggle.tsx`:

```tsx
"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";

export function LanguageToggle() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const toggleLocale = () => {
    const newLocale = locale === "it" ? "en" : "it";
    const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`);

    startTransition(() => {
      router.replace(newPathname);
    });
  };

  return (
    <button
      onClick={toggleLocale}
      disabled={isPending}
      className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted/50 backdrop-blur-sm border border-border/50 text-sm font-medium transition-all hover:bg-muted hover:border-border disabled:opacity-50"
    >
      <span className={locale === "it" ? "text-primary" : "text-muted-foreground"}>
        IT
      </span>
      <span className="text-muted-foreground">/</span>
      <span className={locale === "en" ? "text-primary" : "text-muted-foreground"}>
        EN
      </span>
    </button>
  );
}
```

**Step 2: Create header component**

Create `components/layout/header.tsx`:

```tsx
import Image from "next/image";
import Link from "next/link";
import { LanguageToggle } from "./language-toggle";

interface HeaderProps {
  locale: string;
}

export function Header({ locale }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href={`/${locale}`} className="flex items-center">
          <Image
            src="/logos/04_HVO.jpg"
            alt="HVO"
            width={100}
            height={40}
            className="h-10 w-auto"
            priority
          />
        </Link>
        <LanguageToggle />
      </div>
    </header>
  );
}
```

**Step 3: Commit**

```bash
git add components/layout/
git commit -m "feat: add Header and LanguageToggle components"
```

---

### Task 10: Create Footer Component

**Files:**
- Create: `components/layout/footer.tsx`

**Step 1: Create footer**

Create `components/layout/footer.tsx`:

```tsx
import { useTranslations } from "next-intl";
import Image from "next/image";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-border/50 bg-background/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/logos/04_HVO.jpg"
            alt="HVO"
            width={80}
            height={32}
            className="h-8 w-auto opacity-70"
          />
          <p className="text-sm text-muted-foreground">{t("copyright")}</p>
        </div>
      </div>
    </footer>
  );
}
```

**Step 2: Commit**

```bash
git add components/layout/footer.tsx
git commit -m "feat: add Footer component"
```

---

### Task 11: Create Layout Index and Update Locale Layout

**Files:**
- Create: `components/layout/index.ts`
- Modify: `app/[locale]/layout.tsx`

**Step 1: Create layout barrel export**

Create `components/layout/index.ts`:

```typescript
export { Header } from "./header";
export { Footer } from "./footer";
export { LanguageToggle } from "./language-toggle";
```

**Step 2: Update locale layout to include Header and Footer**

Replace `app/[locale]/layout.tsx`:

```tsx
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Inter } from "next/font/google";
import { Header, Footer } from "@/components/layout";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} className="dark">
      <body className={`${inter.variable} font-sans min-h-screen flex flex-col`}>
        <NextIntlClientProvider messages={messages}>
          <Header locale={locale} />
          <main className="flex-1 pt-16">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

**Step 3: Copy logo to public folder**

```bash
mkdir -p public/logos
cp logos/04_HVO.jpg public/logos/
```

**Step 4: Verify header and footer render**

Run: `npm run dev`
Expected: Header with logo and language toggle, footer at bottom

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: integrate Header and Footer into locale layout"
```

---

## Phase 5: Public Homepage

### Task 12: Create Hero Section

**Files:**
- Create: `components/home/hero.tsx`

**Step 1: Create hero component with animations**

Create `components/home/hero.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import Image from "next/image";

export function Hero() {
  const t = useTranslations("hero");

  const scrollToEvents = () => {
    document.getElementById("events")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative"
      >
        <Image
          src="/logos/04_HVO.jpg"
          alt="HVO"
          width={300}
          height={120}
          className="h-24 md:h-32 w-auto"
          priority
        />
        {/* Glow effect */}
        <div className="absolute inset-0 blur-3xl bg-primary/20 -z-10 animate-glow-pulse" />
      </motion.div>

      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
        className="mt-6 text-xl md:text-2xl text-muted-foreground tracking-wide"
      >
        {t("tagline")}
      </motion.p>

      {/* Scroll indicator */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        onClick={scrollToEvents}
        className="absolute bottom-8 text-muted-foreground hover:text-primary transition-colors"
        aria-label="Scroll to events"
      >
        <ChevronDown className="h-8 w-8 animate-bounce-slow" />
      </motion.button>
    </section>
  );
}
```

**Step 2: Commit**

```bash
git add components/home/
git commit -m "feat: add Hero section with Framer Motion animations"
```

---

### Task 13: Create Event Card Component

**Files:**
- Create: `components/events/event-card.tsx`

**Step 1: Create event card with animations**

Create `components/events/event-card.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import { MapPin, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Event } from "@/lib/database.types";

interface EventCardProps {
  event: Event;
  index: number;
}

export function EventCard({ event, index }: EventCardProps) {
  const t = useTranslations("events");
  const locale = useLocale();

  const formattedDate = new Date(event.date).toLocaleDateString(
    locale === "it" ? "it-IT" : "en-US",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
    }
  );

  const formattedTime = event.time.slice(0, 5); // HH:MM

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
      className="relative overflow-hidden rounded-xl bg-card border border-border/50 group"
    >
      {/* Image container */}
      <div className="relative aspect-[16/9] overflow-hidden">
        {event.image_url ? (
          <Image
            src={event.image_url}
            alt={event.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20" />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

        {/* Content overlay */}
        <div className="absolute inset-0 p-6 flex flex-col justify-end">
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            {event.name}
          </h3>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-primary" />
              {event.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-primary" />
              {formattedDate}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary" />
              {formattedTime}
            </span>
          </div>

          {event.is_booking_open && event.booking_link && (
            <Button
              asChild
              className="w-fit bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all"
            >
              <a href={event.booking_link} target="_blank" rel="noopener noreferrer">
                {t("book")}
              </a>
            </Button>
          )}
        </div>
      </div>
    </motion.article>
  );
}
```

**Step 2: Commit**

```bash
git add components/events/
git commit -m "feat: add EventCard component with booking button logic"
```

---

### Task 14: Create Events List Component

**Files:**
- Create: `components/events/events-list.tsx`
- Create: `components/events/index.ts`

**Step 1: Create events list**

Create `components/events/events-list.tsx`:

```tsx
import { useTranslations } from "next-intl";
import { EventCard } from "./event-card";
import type { Event } from "@/lib/database.types";

interface EventsListProps {
  events: Event[];
}

export function EventsList({ events }: EventsListProps) {
  const t = useTranslations("events");

  return (
    <section id="events" className="py-16 px-4">
      <div className="container mx-auto max-w-4xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          {t("title")}
        </h2>

        {events.length === 0 ? (
          <p className="text-center text-muted-foreground text-lg">
            {t("noEvents")}
          </p>
        ) : (
          <div className="space-y-8">
            {events.map((event, index) => (
              <EventCard key={event.id} event={event} index={index} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
```

**Step 2: Create barrel export**

Create `components/events/index.ts`:

```typescript
export { EventCard } from "./event-card";
export { EventsList } from "./events-list";
```

**Step 3: Commit**

```bash
git add components/events/
git commit -m "feat: add EventsList component"
```

---

### Task 15: Update Homepage with Hero and Events

**Files:**
- Create: `lib/supabase/queries.ts`
- Modify: `app/[locale]/page.tsx`

**Step 1: Create queries helper**

Create `lib/supabase/queries.ts`:

```typescript
import { createClient } from "./server";
import type { Event } from "@/lib/database.types";

export async function getActiveEvents(): Promise<Event[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("is_active", true)
    .order("date", { ascending: true });

  if (error) {
    console.error("Error fetching events:", error);
    return [];
  }

  return data || [];
}
```

**Step 2: Update homepage**

Replace `app/[locale]/page.tsx`:

```tsx
import { Hero } from "@/components/home/hero";
import { EventsList } from "@/components/events";
import { getActiveEvents } from "@/lib/supabase/queries";

export default async function HomePage() {
  const events = await getActiveEvents();

  return (
    <>
      <Hero />
      <EventsList events={events} />
    </>
  );
}
```

**Step 3: Create home component barrel**

Create `components/home/index.ts`:

```typescript
export { Hero } from "./hero";
```

**Step 4: Verify homepage renders**

Run: `npm run dev`
Expected: Hero section with logo animation, Events section below (empty state message)

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: complete public homepage with Hero and Events"
```

---

## Phase 6: Admin Authentication

### Task 16: Update Middleware for Admin Protection

**Files:**
- Modify: `middleware.ts`

**Step 1: Update middleware with auth protection**

Replace `middleware.ts`:

```typescript
import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { updateSession } from "./lib/supabase/middleware";

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if it's an admin route
  const isAdminRoute = pathname.includes("/admin");
  const isLoginRoute = pathname.includes("/admin/login");
  const isRegisterRoute = pathname.includes("/admin/register");

  if (isAdminRoute && !isLoginRoute && !isRegisterRoute) {
    const { supabaseResponse, user } = await updateSession(request);

    if (!user) {
      // Extract locale from pathname
      const locale = pathname.split("/")[1] || "it";
      const loginUrl = new URL(`/${locale}/admin/login`, request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Apply intl middleware and merge cookies
    const intlResponse = intlMiddleware(request);

    // Copy Supabase cookies to intl response
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      intlResponse.cookies.set(cookie.name, cookie.value, cookie);
    });

    return intlResponse;
  }

  // For non-admin routes, just apply intl middleware
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/", "/(it|en)/:path*"],
};
```

**Step 2: Commit**

```bash
git add middleware.ts
git commit -m "feat: add admin route protection to middleware"
```

---

### Task 17: Create Admin Login Page

**Files:**
- Create: `app/[locale]/admin/login/page.tsx`
- Create: `components/admin/login-form.tsx`

**Step 1: Create login form component**

Create `components/admin/login-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

interface LoginFormProps {
  locale: string;
}

export function LoginForm({ locale }: LoginFormProps) {
  const t = useTranslations("admin.login");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(t("error"));
      setLoading(false);
      return;
    }

    router.push(`/${locale}/admin/dashboard`);
    router.refresh();
  };

  return (
    <Card className="w-full max-w-md bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="text-center">
        <Image
          src="/logos/04_HVO.jpg"
          alt="HVO"
          width={120}
          height={48}
          className="h-12 w-auto mx-auto mb-4"
        />
        <CardTitle className="text-2xl">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-input border-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("password")}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-input border-border"
            />
          </div>
          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}
          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={loading}
          >
            {loading ? "..." : t("submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

**Step 2: Create login page**

Create `app/[locale]/admin/login/page.tsx`:

```tsx
import { LoginForm } from "@/components/admin/login-form";

interface LoginPageProps {
  params: Promise<{ locale: string }>;
}

export default async function LoginPage({ params }: LoginPageProps) {
  const { locale } = await params;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <LoginForm locale={locale} />
    </div>
  );
}
```

**Step 3: Create admin components barrel**

Create `components/admin/index.ts`:

```typescript
export { LoginForm } from "./login-form";
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add admin login page and form"
```

---

### Task 18: Create Admin Registration Page

**Files:**
- Create: `app/[locale]/admin/register/page.tsx`
- Create: `components/admin/register-form.tsx`

**Step 1: Create register form component**

Create `components/admin/register-form.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Image from "next/image";

interface RegisterFormProps {
  locale: string;
}

export function RegisterForm({ locale }: RegisterFormProps) {
  const t = useTranslations("admin.login");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkToken = async () => {
      if (!token) {
        setChecking(false);
        return;
      }

      const supabase = createClient();
      const { data } = await supabase
        .from("admin_invites")
        .select("email, is_confirmed")
        .eq("invitation_token", token)
        .single();

      if (data && !data.is_confirmed) {
        setEmail(data.email);
        setValidToken(true);
      }
      setChecking(false);
    };

    checkToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Registration successful - redirect to login
    // Note: User needs to be confirmed by master admin before they can access dashboard
    router.push(`/${locale}/admin/login?registered=true`);
  };

  if (checking) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!token || !validToken) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="pt-6 text-center">
            <p className="text-red-500">Invalid or expired invitation link.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="text-center">
        <Image
          src="/logos/04_HVO.jpg"
          alt="HVO"
          width={120}
          height={48}
          className="h-12 w-auto mx-auto mb-4"
        />
        <CardTitle className="text-2xl">Create Account</CardTitle>
        <CardDescription>Complete your admin registration</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              disabled
              className="bg-input border-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("password")}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="bg-input border-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="bg-input border-border"
            />
          </div>
          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}
          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={loading}
          >
            {loading ? "..." : "Register"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

**Step 2: Create register page**

Create `app/[locale]/admin/register/page.tsx`:

```tsx
import { RegisterForm } from "@/components/admin/register-form";

interface RegisterPageProps {
  params: Promise<{ locale: string }>;
}

export default async function RegisterPage({ params }: RegisterPageProps) {
  const { locale } = await params;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <RegisterForm locale={locale} />
    </div>
  );
}
```

**Step 3: Update admin components barrel**

Update `components/admin/index.ts`:

```typescript
export { LoginForm } from "./login-form";
export { RegisterForm } from "./register-form";
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add admin registration page with token validation"
```

---

## Phase 7: Admin Dashboard

### Task 19: Create Admin Dashboard Layout

**Files:**
- Create: `app/[locale]/admin/layout.tsx`
- Create: `components/admin/sidebar.tsx`

**Step 1: Create sidebar component**

Create `components/admin/sidebar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import Image from "next/image";

interface SidebarProps {
  locale: string;
}

export function Sidebar({ locale }: SidebarProps) {
  const t = useTranslations("admin.nav");
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { href: `/${locale}/admin/dashboard`, label: t("dashboard"), icon: LayoutDashboard },
    { href: `/${locale}/admin/events`, label: t("events"), icon: CalendarDays },
    { href: `/${locale}/admin/users`, label: t("users"), icon: Users },
    { href: `/${locale}/admin/profile`, label: t("profile"), icon: User },
  ];

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/admin/login`);
    router.refresh();
  };

  const NavContent = () => (
    <>
      <div className="p-4 border-b border-border/50">
        <Image
          src="/logos/04_HVO.jpg"
          alt="HVO"
          width={100}
          height={40}
          className="h-8 w-auto"
        />
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border/50">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 mr-3" />
          {t("logout")}
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border/50 transform transition-transform md:hidden flex flex-col",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <NavContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 bg-card border-r border-border/50 flex-col">
        <NavContent />
      </aside>
    </>
  );
}
```

**Step 2: Create admin layout**

Create `app/[locale]/admin/layout.tsx`:

```tsx
import { Sidebar } from "@/components/admin/sidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const { locale } = await params;

  return (
    <div className="min-h-screen">
      <Sidebar locale={locale} />
      <main className="md:ml-64 min-h-screen p-4 md:p-8 pt-16 md:pt-8">
        {children}
      </main>
    </div>
  );
}
```

**Step 3: Update admin components barrel**

Update `components/admin/index.ts`:

```typescript
export { LoginForm } from "./login-form";
export { RegisterForm } from "./register-form";
export { Sidebar } from "./sidebar";
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add admin dashboard layout with sidebar navigation"
```

---

### Task 20: Create Admin Dashboard Page

**Files:**
- Create: `app/[locale]/admin/dashboard/page.tsx`

**Step 1: Create dashboard page**

Create `app/[locale]/admin/dashboard/page.tsx`:

```tsx
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { CalendarDays, Users, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const t = await getTranslations("admin.nav");
  const supabase = await createClient();

  // Fetch stats
  const [eventsResult, activeEventsResult, invitesResult] = await Promise.all([
    supabase.from("events").select("id", { count: "exact" }),
    supabase.from("events").select("id", { count: "exact" }).eq("is_active", true),
    supabase.from("admin_invites").select("id", { count: "exact" }).eq("is_confirmed", false),
  ]);

  const totalEvents = eventsResult.count || 0;
  const activeEvents = activeEventsResult.count || 0;
  const pendingInvites = invitesResult.count || 0;

  const stats = [
    {
      title: "Total Events",
      value: totalEvents,
      icon: CalendarDays,
      color: "text-primary",
    },
    {
      title: "Active Events",
      value: activeEvents,
      icon: CheckCircle,
      color: "text-green-500",
    },
    {
      title: "Pending Invites",
      value: pendingInvites,
      icon: Clock,
      color: "text-yellow-500",
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">{t("dashboard")}</h1>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="bg-card/50 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/[locale]/admin/dashboard/
git commit -m "feat: add admin dashboard page with stats"
```

---

### Task 21: Create Events Management Page

**Files:**
- Create: `app/[locale]/admin/events/page.tsx`
- Create: `components/admin/events-table.tsx`
- Create: `components/admin/event-form.tsx`

**Step 1: Create events table component**

Create `components/admin/events-table.tsx`:

```tsx
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
```

**Step 2: Create event form component**

Create `components/admin/event-form.tsx`:

```tsx
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
```

**Step 3: Create events management page**

Create `app/[locale]/admin/events/page.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventsTable } from "@/components/admin/events-table";
import { EventForm } from "@/components/admin/event-form";
import type { Event } from "@/lib/database.types";

interface EventsPageProps {
  params: Promise<{ locale: string }>;
}

export default function EventsPage({ params }: EventsPageProps) {
  const t = useTranslations("admin.events");
  const [events, setEvents] = useState<Event[]>([]);
  const [editEvent, setEditEvent] = useState<Event | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [locale, setLocale] = useState("it");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(p => setLocale(p.locale));
  }, [params]);

  useEffect(() => {
    const fetchEvents = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("events")
        .select("*")
        .order("date", { ascending: false });
      setEvents(data || []);
      setLoading(false);
    };
    fetchEvents();
  }, [showForm]);

  const handleEdit = (event: Event) => {
    setEditEvent(event);
    setShowForm(true);
  };

  const handleClose = () => {
    setEditEvent(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-primary text-primary-foreground"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("new")}
        </Button>
      </div>

      <EventsTable events={events} locale={locale} onEdit={handleEdit} />

      <EventForm
        event={editEvent}
        open={showForm}
        onClose={handleClose}
      />
    </div>
  );
}
```

**Step 4: Update admin components barrel**

Update `components/admin/index.ts`:

```typescript
export { LoginForm } from "./login-form";
export { RegisterForm } from "./register-form";
export { Sidebar } from "./sidebar";
export { EventsTable } from "./events-table";
export { EventForm } from "./event-form";
```

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add events management page with CRUD operations"
```

---

### Task 22: Create User Management Page

**Files:**
- Create: `app/[locale]/admin/users/page.tsx`
- Create: `components/admin/user-management.tsx`

**Step 1: Create user management component**

Create `components/admin/user-management.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Copy, Check, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminInvite, Profile } from "@/lib/database.types";

interface UserManagementProps {
  invites: AdminInvite[];
  profiles: Profile[];
  isMasterAdmin: boolean;
  locale: string;
}

export function UserManagement({ invites, profiles, isMasterAdmin, locale }: UserManagementProps) {
  const t = useTranslations("admin.users");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const pendingInvites = invites.filter((i) => !i.is_confirmed);
  const confirmedProfiles = profiles.filter((p) => !p.is_master_admin);

  const generateInviteLink = async () => {
    if (!email) return;
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const token = crypto.randomUUID();

    const { error } = await supabase.from("admin_invites").insert({
      email,
      invitation_token: token,
      invited_by: user?.id,
    });

    if (!error) {
      const link = `${window.location.origin}/${locale}/admin/register?token=${token}`;
      setGeneratedLink(link);
      setEmail("");
      router.refresh();
    }

    setLoading(false);
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const confirmUser = async (inviteId: string) => {
    const supabase = createClient();
    await supabase.from("admin_invites").update({ is_confirmed: true }).eq("id", inviteId);
    router.refresh();
  };

  return (
    <div className="space-y-8">
      {/* Invite Section */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            {t("invite")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="email" className="sr-only">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-input border-border"
              />
            </div>
            <Button
              onClick={generateInviteLink}
              disabled={!email || loading}
              className="bg-primary text-primary-foreground"
            >
              {loading ? "..." : t("generateLink")}
            </Button>
          </div>

          {generatedLink && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Registration link:</p>
              <div className="flex gap-2">
                <Input
                  value={generatedLink}
                  readOnly
                  className="bg-input border-border text-xs"
                />
                <Button variant="outline" size="icon" onClick={copyLink}>
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              {copied && (
                <p className="text-xs text-green-500 mt-1">{t("linkCopied")}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invites */}
      {isMasterAdmin && pendingInvites.length > 0 && (
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>{t("pending")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <span className="text-sm">{invite.email}</span>
                  <Button
                    size="sm"
                    onClick={() => confirmUser(invite.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {t("confirmUser")}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmed Admins */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle>{t("confirmed")}</CardTitle>
        </CardHeader>
        <CardContent>
          {confirmedProfiles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No other admins yet</p>
          ) : (
            <div className="space-y-2">
              {confirmedProfiles.map((profile) => (
                <div
                  key={profile.id}
                  className="p-3 bg-muted/30 rounded-lg"
                >
                  <span className="text-sm">{profile.email}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 2: Create users page**

Create `app/[locale]/admin/users/page.tsx`:

```tsx
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { UserManagement } from "@/components/admin/user-management";

interface UsersPageProps {
  params: Promise<{ locale: string }>;
}

export default async function UsersPage({ params }: UsersPageProps) {
  const { locale } = await params;
  const t = await getTranslations("admin.users");
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const [invitesResult, profilesResult, currentProfileResult] = await Promise.all([
    supabase.from("admin_invites").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("*"),
    supabase.from("profiles").select("is_master_admin").eq("id", user?.id || "").single(),
  ]);

  const isMasterAdmin = currentProfileResult.data?.is_master_admin || false;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>
      <UserManagement
        invites={invitesResult.data || []}
        profiles={profilesResult.data || []}
        isMasterAdmin={isMasterAdmin}
        locale={locale}
      />
    </div>
  );
}
```

**Step 3: Update admin components barrel**

Update `components/admin/index.ts`:

```typescript
export { LoginForm } from "./login-form";
export { RegisterForm } from "./register-form";
export { Sidebar } from "./sidebar";
export { EventsTable } from "./events-table";
export { EventForm } from "./event-form";
export { UserManagement } from "./user-management";
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add user management page with invite system"
```

---

### Task 23: Create Profile Page

**Files:**
- Create: `app/[locale]/admin/profile/page.tsx`
- Create: `components/admin/profile-form.tsx`

**Step 1: Create profile form component**

Create `components/admin/profile-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProfileFormProps {
  email: string;
}

export function ProfileForm({ email }: ProfileFormProps) {
  const t = useTranslations("admin.profile");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    // First verify current password by signing in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });

    if (signInError) {
      setError("Current password is incorrect");
      setLoading(false);
      return;
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setLoading(false);
  };

  return (
    <div className="space-y-8 max-w-md">
      {/* Email display */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle>Email</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{email}</p>
        </CardContent>
      </Card>

      {/* Password change */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle>{t("changePassword")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{t("currentPassword")}</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t("newPassword")}</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-input border-border"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-green-500">{t("passwordChanged")}</p>}
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground"
              disabled={loading}
            >
              {loading ? "..." : t("changePassword")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 2: Create profile page**

Create `app/[locale]/admin/profile/page.tsx`:

```tsx
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { ProfileForm } from "@/components/admin/profile-form";

export default async function ProfilePage() {
  const t = await getTranslations("admin.profile");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>
      <ProfileForm email={user?.email || ""} />
    </div>
  );
}
```

**Step 3: Update admin components barrel**

Update `components/admin/index.ts`:

```typescript
export { LoginForm } from "./login-form";
export { RegisterForm } from "./register-form";
export { Sidebar } from "./sidebar";
export { EventsTable } from "./events-table";
export { EventForm } from "./event-form";
export { UserManagement } from "./user-management";
export { ProfileForm } from "./profile-form";
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add profile page with password change"
```

---

## Phase 8: Final Polish

### Task 24: Add Loading and Error States

**Files:**
- Create: `app/[locale]/loading.tsx`
- Create: `app/[locale]/error.tsx`
- Create: `app/[locale]/admin/loading.tsx`

**Step 1: Create public loading state**

Create `app/[locale]/loading.tsx`:

```tsx
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
```

**Step 2: Create error boundary**

Create `app/[locale]/error.tsx`:

```tsx
"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("common");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-muted-foreground">{t("error")}</p>
      <Button onClick={reset} variant="outline">
        Try again
      </Button>
    </div>
  );
}
```

**Step 3: Create admin loading state**

Create `app/[locale]/admin/loading.tsx`:

```tsx
export default function AdminLoading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add loading and error states"
```

---

### Task 25: Add SEO Metadata

**Files:**
- Modify: `app/[locale]/layout.tsx`
- Create: `app/[locale]/opengraph-image.tsx`

**Step 1: Update locale layout with dynamic metadata**

Add to `app/[locale]/layout.tsx` after imports:

```tsx
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const title = "HVO Events";
  const description =
    locale === "it"
      ? "Eventi underground di musica elettronica - Tech House, House, Latin House, Techno"
      : "Underground electronic music events - Tech House, House, Latin House, Techno";

  return {
    title: {
      default: title,
      template: `%s | ${title}`,
    },
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: locale === "it" ? "it_IT" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add SEO metadata with locale support"
```

---

### Task 26: Final Verification and Build

**Step 1: Run linter**

```bash
npm run lint
```

Fix any lint errors that appear.

**Step 2: Run build**

```bash
npm run build
```

Fix any build errors.

**Step 3: Test locally**

```bash
npm run start
```

Manual verification checklist:
- [ ] Homepage loads with hero and events section
- [ ] Language toggle switches between IT/EN
- [ ] Admin login works at `/it/admin/login`
- [ ] Dashboard shows stats
- [ ] Events CRUD works
- [ ] Image upload works
- [ ] User invite generates link
- [ ] Profile password change works

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: fix lint and build errors"
```

---

## Deployment Checklist

1. **Create Supabase Project:**
   - Go to supabase.com and create project
   - Run SQL migration in SQL Editor
   - Create master admin user in Authentication
   - Copy URL and anon key

2. **Configure Vercel:**
   - Connect GitHub repo
   - Add environment variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Deploy

3. **Post-Deploy:**
   - Test all functionality on production URL
   - Verify RLS policies work correctly
