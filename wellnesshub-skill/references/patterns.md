# WellnessHub — Common Patterns & Code Snippets

## Table of Contents
1. [Supabase Clients](#supabase-clients)
2. [Auth & Role Checks](#auth--role-checks)
3. [Booking Flow](#booking-flow)
4. [Conflict Detection](#conflict-detection)
5. [Promo Code Validation](#promo-code-validation)
6. [Notifications](#notifications)
7. [Reports / Aggregations](#reports--aggregations)
8. [Localization / RTL](#localization--rtl)
9. [Multi-tenant Query Pattern](#multi-tenant-query-pattern)

---

## Supabase Clients

```ts
// lib/supabase/server.ts
import { createServerClient as _create } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

export function createServerClient() {
  const cookieStore = cookies()
  return _create<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (n) => cookieStore.get(n)?.value } }
  )
}
```

```ts
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

---

## Auth & Role Checks

```ts
// lib/auth/helpers.ts
import { createServerClient } from '@/lib/supabase/server'

export async function getServerUser() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}

export async function requireAdmin(businessId: string) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  const { data } = await supabase
    .from('business_users')
    .select('id')
    .eq('business_id', businessId)
    .eq('user_id', user.id)
    .single()

  if (!data) throw new Error('Unauthorized')
  return user
}
```

---

## Booking Flow

```ts
// modules/bookings/actions.ts
'use server'
import { createServerClient } from '@/lib/supabase/server'
import { sendNotification } from '@/modules/notifications'
import { validatePromoCode } from '@/modules/promo/validate'
import { detectConflict } from './conflict'

export interface CreateBookingInput {
  businessId: string
  serviceId: string
  packageId: string
  scheduledAt: string   // ISO string
  promoCode?: string
  notes?: string
}

export async function createBooking(input: CreateBookingInput) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  // Validate promo code if provided
  let promoCodeId: string | null = null
  let discountAmount = 0
  if (input.promoCode) {
    const promo = await validatePromoCode(input.promoCode, input.businessId, user.id)
    promoCodeId = promo.id
    discountAmount = promo.discountAmount
  }

  // Fetch package price
  const { data: pkg } = await supabase
    .from('packages')
    .select('price')
    .eq('id', input.packageId)
    .single()
  if (!pkg) throw new Error('Package not found')

  // Check for conflicts (non-blocking)
  const hasConflict = await detectConflict({
    businessId: input.businessId,
    scheduledAt: input.scheduledAt,
  })

  // Insert booking
  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      business_id: input.businessId,
      customer_id: user.id,
      service_id: input.serviceId,
      package_id: input.packageId,
      scheduled_at: input.scheduledAt,
      status: 'pending',
      conflict_flag: hasConflict,
      promo_code_id: promoCodeId,
      notes: input.notes,
    })
    .select()
    .single()

  if (error) throw error

  // Insert payment record
  await supabase.from('payments').insert({
    booking_id: booking.id,
    business_id: input.businessId,
    amount: pkg.price,
    discount_amount: discountAmount,
    payment_status: 'pending',
  })

  // Track promo usage
  if (promoCodeId) {
    await supabase.from('promo_usages').insert({
      promo_code_id: promoCodeId,
      booking_id: booking.id,
      customer_id: user.id,
    })
  }

  // Send notification
  await sendNotification({ type: 'booking_created', bookingId: booking.id })

  return booking
}

// Admin: approve or reject
export async function updateBookingStatus(
  bookingId: string,
  status: 'approved' | 'rejected',
  businessId: string
) {
  const supabase = createServerClient()
  await requireAdmin(businessId) // throws if not admin

  const { data, error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', bookingId)
    .eq('business_id', businessId)
    .select()
    .single()

  if (error) throw error

  await sendNotification({
    type: status === 'approved' ? 'booking_approved' : 'booking_rejected',
    bookingId,
  })

  return data
}
```

---

## Conflict Detection

```ts
// modules/bookings/conflict.ts
import { createServerClient } from '@/lib/supabase/server'

export async function detectConflict({
  businessId,
  scheduledAt,
}: {
  businessId: string
  scheduledAt: string
}) {
  const supabase = createServerClient()
  const windowStart = new Date(new Date(scheduledAt).getTime() - 30 * 60000).toISOString()
  const windowEnd = new Date(new Date(scheduledAt).getTime() + 30 * 60000).toISOString()

  const { count } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .in('status', ['pending', 'approved'])
    .gte('scheduled_at', windowStart)
    .lte('scheduled_at', windowEnd)

  return (count ?? 0) > 0
}
```

---

## Promo Code Validation

```ts
// modules/promo/validate.ts
import { createServerClient } from '@/lib/supabase/server'

export async function validatePromoCode(
  code: string,
  businessId: string,
  userId: string
) {
  const supabase = createServerClient()

  const { data: promo } = await supabase
    .from('promo_codes')
    .select('*, promo_usages(count)')
    .eq('business_id', businessId)
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single()

  if (!promo) throw new Error('Invalid promo code')
  if (promo.expiry_date && new Date(promo.expiry_date) < new Date()) throw new Error('Promo expired')
  if (promo.usage_limit !== null && promo.promo_usages[0].count >= promo.usage_limit) {
    throw new Error('Promo usage limit reached')
  }

  // Check user hasn't used it before
  const { count } = await supabase
    .from('promo_usages')
    .select('*', { count: 'exact', head: true })
    .eq('promo_code_id', promo.id)
    .eq('customer_id', userId)

  if ((count ?? 0) > 0) throw new Error('Promo already used')

  // Calculate discount (caller passes package price)
  return { id: promo.id, discountType: promo.discount_type, discountValue: promo.value }
}
```

---

## Notifications

```ts
// modules/notifications/index.ts
import { Resend } from 'resend'
import { createServerClient } from '@/lib/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY)

type NotificationType = 'booking_created' | 'booking_approved' | 'booking_rejected'

export async function sendNotification({
  type,
  bookingId,
}: {
  type: NotificationType
  bookingId: string
}) {
  const supabase = createServerClient()
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, users(email, full_name), services(name), packages(name)')
    .eq('id', bookingId)
    .single()

  if (!booking) return

  const subjects: Record<NotificationType, string> = {
    booking_created: 'Booking Received',
    booking_approved: 'Booking Approved ✓',
    booking_rejected: 'Booking Update',
  }

  await resend.emails.send({
    from: 'WellnessHub <noreply@wellnesshub.com>',
    to: booking.users.email,
    subject: subjects[type],
    html: buildEmailHtml(type, booking),
  })

  // Future: Twilio WhatsApp
  // await sendWhatsApp({ type, booking })
}

function buildEmailHtml(type: NotificationType, booking: any): string {
  // Return localized HTML template based on type
  return `<p>Your booking for ${booking.services.name} has been updated.</p>`
}
```

---

## Reports / Aggregations

```sql
-- Supabase RPC for admin dashboard stats
create or replace function get_business_stats(bid uuid, period text default 'month')
returns json as $$
  select json_build_object(
    'total_bookings', count(*),
    'approved_bookings', count(*) filter (where status = 'approved'),
    'pending_bookings', count(*) filter (where status = 'pending'),
    'rejected_bookings', count(*) filter (where status = 'rejected')
  )
  from bookings
  where business_id = bid
    and (
      period = 'month' and created_at >= date_trunc('month', now())
      or period = 'day' and created_at >= date_trunc('day', now())
    );
$$ language sql security definer;
```

```ts
// Usage in server action
const { data } = await supabase.rpc('get_business_stats', {
  bid: businessId,
  period: 'month',
})
```

---

## Localization / RTL

```tsx
// app/layout.tsx
import { NextIntlClientProvider } from 'next-intl'
import { getLocale } from 'next-intl/server'

export default async function RootLayout({ children }) {
  const locale = await getLocale()  // 'ar' | 'en'
  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <body>{children}</body>
    </html>
  )
}
```

- Use `margin-inline-start` / `margin-inline-end` not `margin-left` / `margin-right`
- Use `text-align: start` not `text-align: left`
- Tailwind: use `ms-` and `me-` prefixes (margin-inline-start/end)
- Store translations in `/messages/ar.json` and `/messages/en.json`

---

## Multi-Tenant Query Pattern

Always scope queries to `business_id`. Never return data across tenant boundaries.

```ts
// ✅ Correct
const { data } = await supabase
  .from('services')
  .select('*')
  .eq('business_id', businessId)  // ← always include this
  .eq('is_active', true)

// ❌ Wrong — returns all businesses' data
const { data } = await supabase
  .from('services')
  .select('*')
```

When writing new queries, treat `business_id` as a required parameter, not optional.
