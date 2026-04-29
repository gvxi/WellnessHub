# WellnessHub — Copilot Instructions

> This file is auto-loaded by GitHub Copilot as workspace context.  
> Place it at `.github/copilot-instructions.md` in the repo root.

WellnessHub is a **multi-tenant service booking web app** for wellness businesses (salons, spas, fitness centers). Customers book services; admins manage bookings manually.

---

## Tech Stack

| Layer | Library / Service |
|---|---|
| Framework | Next.js 14+ (TypeScript, App Router) |
| Database & Auth | Supabase (PostgreSQL + RLS + Google OAuth) |
| Hosting | Vercel |
| Email | Resend |
| WhatsApp | Twilio *(future — stub only)* |
| Animations | **Framer Motion** |
| Icons | **Lucide React** |
| Loading states | **ShadCN `<Skeleton>`** |
| i18n | next-intl |

---

## Brand Colors

Always reference via Tailwind tokens — never hardcode hex values in components.

```ts
// tailwind.config.ts
colors: {
  primary:   '#5A0F1B', // burgundy  — buttons, CTAs, active states
  secondary: '#8E6A94', // plum      — accents, tags, hover
  accent:    '#BFA6C9', // lavender  — subtle highlights, borders
  light:     '#F2EDEE', // off-white — backgrounds, cards
  dark:      '#0E0B0D', // near-black — text, headings
}
```

---

## Project Structure

```
/app
  /(public)       → customer-facing pages
  /(dashboard)    → customer dashboard
  /(admin)        → business owner dashboard

/lib
  supabase/       → server + browser clients, generated types
  auth/           → getServerUser(), requireAdmin()
  utils/

/modules            ← domain logic lives here, not in /app
  auth/
  businesses/
  services/
  bookings/         → actions.ts, conflict.ts, types.ts
  payments/
  notifications/    → index.ts (Resend + Twilio stub)
  reviews/
  promo/            → validate.ts
  reports/

/components
  ui/               → ShadCN primitives
  shared/           → cross-module components
```

Each module owns: `types.ts`, `actions.ts` (server actions), and hooks. Keep logic out of `/app` route files.

---

## User Roles

| Role | Access |
|---|---|
| `customer` | Browse, book, pay, review |
| `admin` | Manage services, approve/reject bookings, view reports |

- Role stored in `users.role`
- Admin access verified via `business_users` table — **not** just `users.role`
- Always check role server-side; never trust client-supplied role

---

## Database Tables

`users` · `businesses` · `business_users` · `categories` · `services` · `packages` · `bookings` · `payments` · `reviews` · `promo_codes` · `promo_usages`

**Multi-tenant rule**: Every tenant-scoped table has `business_id`. Every query must filter by it. Treat `business_id` as a required parameter — never optional.

```ts
// ✅ Always scope to business
supabase.from('services').select('*').eq('business_id', businessId)

// ❌ Never query without tenant scope
supabase.from('services').select('*')
```

---

## Key Schema (abbreviated)

```sql
-- bookings
status text check (status in ('pending', 'approved', 'rejected', 'refunded'))
conflict_flag boolean default false   -- set true when double-booking detected

-- packages
price numeric(10,2), currency text default 'OMR', sessions_count int

-- promo_codes
discount_type text check (discount_type in ('percentage', 'fixed'))
expiry_date date, usage_limit int
```

Full schema → see `/supabase/migrations/` or ask Copilot to reference the schema comments inline.

---

## Booking Logic (Core Rules)

```
Flow: Login → Select Service → Pick Package → Date/Time → Apply Promo → Pay → Booking created as `pending`

Status transitions:
  pending  → approved   (admin action)
  pending  → rejected   (admin action → triggers refund placeholder)
  approved → refunded   (future)
```

- Bookings are **always** created as `pending` — never skip this
- Double booking is **allowed** — set `conflict_flag = true`, admin resolves manually
- No duration enforcement — admin controls the final schedule
- Admin decision is final

---

## Supabase Client Usage

```ts
// Server component or server action → use server client
import { createServerClient } from '@/lib/supabase/server'

// Client component → use browser client
import { createBrowserClient } from '@/lib/supabase/client'
```

Never use the service role key on the client. RLS is mandatory on every table.

---

## Server Action Pattern

```ts
// modules/bookings/actions.ts
'use server'
export async function createBooking(input: CreateBookingInput) {
  const supabase = createServerClient()
  // 1. Auth check
  // 2. Validate promo code if provided
  // 3. Detect conflicts (non-blocking — just set flag)
  // 4. Insert booking with status: 'pending'
  // 5. Insert payment record
  // 6. Track promo usage
  // 7. sendNotification({ type: 'booking_created', bookingId })
}
```

---

## RLS — Critical Policies

```sql
-- Helper (run once)
create function is_business_admin(bid uuid) returns boolean as $$
  select exists (select 1 from business_users where business_id = bid and user_id = auth.uid())
$$ language sql security definer;

-- Bookings: customers see own, admins see business
create policy "customers_view_own_bookings" on bookings for select using (customer_id = auth.uid());
create policy "admins_view_business_bookings" on bookings for select using (is_business_admin(business_id));
create policy "admins_update_bookings" on bookings for update using (is_business_admin(business_id));

-- Reviews: only after approved booking
create policy "customers_insert_reviews" on reviews for insert with check (
  customer_id = auth.uid() and
  exists (select 1 from bookings where id = reviews.booking_id and customer_id = auth.uid() and status = 'approved')
);
```

---

## UI Library Conventions

### Framer Motion — all animations
```tsx
import { motion, AnimatePresence } from 'framer-motion'

// Standard entrance
<motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: 'easeOut' }}>

// Use AnimatePresence for modals, toasts, stepper transitions
// Use staggerChildren for lists
// Max 300ms for UI feedback, 500ms for page transitions
```

### Lucide React — all icons
```tsx
import { CalendarDays, CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react'
// Size via className only: "w-4 h-4" or "w-5 h-5" — never inline style
```

### ShadCN Skeleton — all loading states
```tsx
import { Skeleton } from '@/components/ui/skeleton'

// Every data-fetching component needs a skeleton variant
// Co-locate: BookingCard.tsx + BookingCardSkeleton.tsx in same file or folder
<div className="space-y-2">
  <Skeleton className="h-5 w-3/4" />
  <Skeleton className="h-4 w-1/2" />
</div>
```

---

## Localization / RTL

- Default language: **Arabic (RTL)**
- Also supports English (LTR)
- Apply `dir` on root layout based on locale:

```tsx
<html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
```

- Use logical CSS properties: `margin-inline-start` not `margin-left`
- Tailwind: prefer `ms-`, `me-`, `ps-`, `pe-` prefixes
- All user-facing strings in `/messages/ar.json` and `/messages/en.json`

---

## Notifications

```ts
// Always call after booking state changes
import { sendNotification } from '@/modules/notifications'

await sendNotification({ type: 'booking_created' | 'booking_approved' | 'booking_rejected', bookingId })
```

Email via Resend. WhatsApp via Twilio is stubbed — implement the interface now, wire later.

---

## Code Generation Checklist

Before generating any code, verify:

- [ ] TypeScript types defined — no `any`
- [ ] Query scoped to `business_id`
- [ ] Booking inserts use `status: 'pending'`
- [ ] Admin actions call `requireAdmin(businessId)` first
- [ ] Notifications called after status changes
- [ ] Loading state has a `<Skeleton>` variant
- [ ] Animations use Framer Motion
- [ ] Icons use Lucide React
- [ ] Colors use Tailwind tokens (`bg-primary`, `text-secondary`, etc.)
- [ ] RTL-safe CSS properties used
