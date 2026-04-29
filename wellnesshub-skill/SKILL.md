---
name: wellnesshub
description: >
  Project context and coding assistant for WellnessHub.com — a multi-tenant service booking web app
  built with Next.js (TypeScript), Supabase, Vercel, and Resend. Use this skill whenever the user
  asks to build, extend, debug, or design any part of the WellnessHub project. Triggers include:
  mentions of WellnessHub, any of its modules (bookings, services, packages, reviews, promo codes,
  reports), Supabase RLS for this project, multi-tenant isolation, booking flows, admin dashboard,
  or any component/page/API route in this codebase. Even if the user says something generic like
  "add a booking page" or "write the RLS policy" — if this project is in context, use this skill.
---

# WellnessHub Skill

Multi-tenant service booking platform. Always consult this skill before writing any code, schema, or architecture for this project.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (TypeScript, App Router) |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| Hosting | Vercel |
| Email | Resend |
| WhatsApp | Twilio (future) |
| PWA | Admin dashboard installable on iOS |
| Animations | Framer Motion |
| Icons | Lucide React |
| Skeleton / UI | ShadCN (`Skeleton`, and other ShadCN primitives) |

### Brand Colors
| Token | Hex | Usage |
|---|---|---|
| `primary` | `#5A0F1B` | Buttons, CTAs, active states |
| `secondary` | `#8E6A94` | Accents, tags, hover states |
| `accent` | `#BFA6C9` | Subtle highlights, borders |
| `light` | `#F2EDEE` | Page backgrounds, cards |
| `dark` | `#0E0B0D` | Text, headings |

Always use these tokens via Tailwind CSS variables — never hardcode hex values in components. Define them in `tailwind.config.ts`:
```ts
colors: {
  primary: '#5A0F1B',
  secondary: '#8E6A94',
  accent: '#BFA6C9',
  light: '#F2EDEE',
  dark: '#0E0B0D',
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
  supabase/       → client + server clients
  auth/           → session helpers, role checks
  utils/          → shared utilities

/modules
  auth/
  businesses/
  services/
  bookings/
  payments/
  notifications/
  reviews/
  promo/
  reports/

/components
  ui/             → base design system components
  shared/         → cross-module reusable components
```

Keep logic **modular** — one folder per domain in `/modules`. Each module owns its types, server actions, and hooks.

---

## User Roles

- **customer** — Google OAuth login; browse, book, pay, review
- **admin** — Business owner; manage services, approve/reject bookings, view reports

Role stored in `users.role`. Always check role in both RLS policies **and** middleware.

---

## Database Tables

See `references/schema.md` for full column definitions and RLS policies.

Core tables:
`users` · `businesses` · `business_users` · `categories` · `services` · `packages` · `bookings` · `payments` · `reviews` · `promo_codes` · `promo_usages`

**Critical rule**: Every tenant-scoped table must have a `business_id` column and a corresponding RLS policy that filters by it.

---

## Module Reference

### Auth Module
- Google OAuth via Supabase (`supabase.auth.signInWithOAuth`)
- After sign-in, upsert user into `users` table with role = `customer` by default
- Admins are granted role via `business_users` table
- Use `getServerSideUser()` helper in server components; never trust client-side role

### Business Module
Each business: `id`, `name`, `description`, `logo_url`, `owner_id`, `working_hours` (JSONB)

### Services Module
Hierarchy: **Category → Service → Package**
- Categories group services (e.g., Fitness, Beauty)
- Services belong to a category
- Packages define pricing options (e.g., 8/10/12 sessions) — no duration enforcement

### Booking Module ← Core
Flow: `User → Select Business → Service → Package → Date/Time → Payment → Booking (pending)`

Status transitions:
```
pending → approved
pending → rejected → (refund placeholder triggered)
approved → refunded (future)
```

Rules:
- Always create as `pending`
- Double booking **allowed** but flagged via `conflict_flag` boolean
- Admin resolves conflicts manually
- No strict time duration enforcement
- Admin decision is final

### Payment Module (Demo Phase)
- Store `payment_status`, `transaction_id` only
- No real processing yet
- Future: Stripe integration

### Notification Module
Triggers: booking created, approved, rejected
- Email via Resend (active)
- WhatsApp via Twilio (future — stub the interface now)

Pattern: `modules/notifications/index.ts` exports `sendNotification({ type, booking, channel })`

### Reviews Module
- Customer can only submit review if booking status = `approved`
- Enforce this in RLS **and** server action validation

### Promo Codes Module
Fields: `code`, `discount_type` (percentage | fixed), `value`, `expiry_date`, `usage_limit`
- Track usage in `promo_usages` (one row per booking)
- Validate: not expired, under usage limit, not reused by same user

### Reports Module
Admin dashboard metrics:
- Total bookings (by status)
- Revenue (sum of approved payments)
- Most booked services
- Daily / monthly breakdowns

Use Supabase RPC or views for aggregations — don't pull raw rows to the client.

---

## Coding Conventions

### Supabase Client Usage
```ts
// Server component / action → use server client
import { createServerClient } from '@/lib/supabase/server'

// Client component → use browser client
import { createBrowserClient } from '@/lib/supabase/client'
```

### Server Actions Pattern
```ts
// modules/bookings/actions.ts
'use server'
export async function createBooking(input: CreateBookingInput) {
  const supabase = createServerClient()
  // 1. Validate input
  // 2. Check promo code if provided
  // 3. Insert booking as 'pending'
  // 4. Insert payment record
  // 5. Trigger notification
  // 6. Return booking
}
```

### Type Conventions
- Define DB types in `lib/supabase/types.ts` (generated from Supabase or hand-authored)
- Use `Database['public']['Tables']['bookings']['Row']` pattern for table types
- Export domain types from each module's `types.ts`

### Localization
- Default language: **Arabic (RTL)**
- Also supports: English
- Use `next-intl` or similar; keep all user-facing strings in locale files
- Apply `dir="rtl"` on root layout; use logical CSS properties (`margin-inline-start` vs `margin-left`)

### UI Libraries

**Framer Motion** — use for all animations:
```tsx
import { motion } from 'framer-motion'

// Page transitions, card entrances, status badge changes
<motion.div
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
>
```
- Animate list items with `staggerChildren`
- Use `AnimatePresence` for conditional rendering (modals, toasts, step transitions)
- Keep animations subtle — max 300ms for UI feedback, 500ms for page-level transitions

**Lucide React** — use for all icons:
```tsx
import { CalendarDays, CheckCircle, Clock, XCircle } from 'lucide-react'
// Always size with className="w-4 h-4" or "w-5 h-5" — never inline style
```

**ShadCN Skeleton** — use for all loading states:
```tsx
import { Skeleton } from '@/components/ui/skeleton'

// Booking card skeleton
<div className="space-y-2">
  <Skeleton className="h-5 w-3/4" />
  <Skeleton className="h-4 w-1/2" />
</div>
```
- Every data-fetching component must have a skeleton variant
- Co-locate skeleton with its component (e.g. `BookingCard` + `BookingCardSkeleton`)

---

## Security Rules

1. **RLS is mandatory** on every table — never rely solely on app-level checks
2. Every admin action must verify `business_users` membership, not just `users.role`
3. Never expose `owner_id` or internal IDs in public-facing URLs without validation
4. Use Supabase service role key **only** in trusted server actions, never on client

For full RLS policy templates → see `references/schema.md`

---

## When Generating Code

1. Check which module the task belongs to → write in that module's folder
2. Always include TypeScript types — no `any`
3. For bookings: always enforce status transition rules
4. For multi-tenant queries: always filter by `business_id`
5. For notifications: call `sendNotification()` after state changes
6. Keep components in `/components`, logic in `/modules`

For schema details and RLS templates → read `references/schema.md`
For common patterns and code snippets → read `references/patterns.md`
