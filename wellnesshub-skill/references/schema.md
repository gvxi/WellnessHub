# WellnessHub — Database Schema & RLS Policies

## Table of Contents
1. [users](#users)
2. [businesses](#businesses)
3. [business_users](#business_users)
4. [categories](#categories)
5. [services](#services)
6. [packages](#packages)
7. [bookings](#bookings)
8. [payments](#payments)
9. [reviews](#reviews)
10. [promo_codes](#promo_codes)
11. [promo_usages](#promo_usages)
12. [RLS Policy Templates](#rls-policy-templates)

---

## users
```sql
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  avatar_url text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  preferred_language text default 'ar',
  created_at timestamptz default now()
);
```

## businesses
```sql
create table businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  logo_url text,
  owner_id uuid references users(id) on delete cascade,
  working_hours jsonb,
  -- example working_hours: {"mon": {"open": "09:00", "close": "18:00"}, ...}
  timezone text default 'Asia/Muscat',
  is_active boolean default true,
  created_at timestamptz default now()
);
```

## business_users
```sql
-- Links admins to businesses (supports multiple admins per business)
create table business_users (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  role text default 'admin',
  created_at timestamptz default now(),
  unique(business_id, user_id)
);
```

## categories
```sql
create table categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  name text not null,
  name_ar text,
  display_order int default 0,
  created_at timestamptz default now()
);
```

## services
```sql
create table services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  name text not null,
  name_ar text,
  description text,
  description_ar text,
  is_active boolean default true,
  created_at timestamptz default now()
);
```

## packages
```sql
create table packages (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references services(id) on delete cascade,
  business_id uuid references businesses(id) on delete cascade,
  name text not null,          -- e.g. "8 Sessions"
  name_ar text,
  sessions_count int,
  price numeric(10,2) not null,
  currency text default 'OMR',
  is_active boolean default true,
  created_at timestamptz default now()
);
```

## bookings
```sql
create table bookings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  customer_id uuid references users(id) on delete cascade,
  service_id uuid references services(id),
  package_id uuid references packages(id),
  scheduled_at timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'refunded')),
  conflict_flag boolean default false,
  notes text,
  promo_code_id uuid references promo_codes(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-update updated_at
create trigger set_updated_at
  before update on bookings
  for each row execute function moddatetime(updated_at);
```

## payments
```sql
create table payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete cascade unique,
  business_id uuid references businesses(id),
  amount numeric(10,2) not null,
  currency text default 'OMR',
  discount_amount numeric(10,2) default 0,
  payment_status text default 'pending'
    check (payment_status in ('pending', 'paid', 'refunded', 'failed')),
  transaction_id text,         -- future: Stripe payment intent ID
  created_at timestamptz default now()
);
```

## reviews
```sql
create table reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete cascade unique,
  business_id uuid references businesses(id),
  customer_id uuid references users(id),
  service_id uuid references services(id),
  rating int check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);
```

## promo_codes
```sql
create table promo_codes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  code text not null,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  value numeric(10,2) not null,
  expiry_date date,
  usage_limit int,
  is_active boolean default true,
  created_at timestamptz default now(),
  unique(business_id, code)
);
```

## promo_usages
```sql
create table promo_usages (
  id uuid primary key default gen_random_uuid(),
  promo_code_id uuid references promo_codes(id) on delete cascade,
  booking_id uuid references bookings(id) on delete cascade,
  customer_id uuid references users(id),
  used_at timestamptz default now(),
  unique(promo_code_id, booking_id)
);
```

---

## RLS Policy Templates

### Enable RLS on all tables
```sql
alter table users enable row level security;
alter table businesses enable row level security;
alter table business_users enable row level security;
alter table categories enable row level security;
alter table services enable row level security;
alter table packages enable row level security;
alter table bookings enable row level security;
alter table payments enable row level security;
alter table reviews enable row level security;
alter table promo_codes enable row level security;
alter table promo_usages enable row level security;
```

### Helper function: is_business_admin
```sql
create or replace function is_business_admin(bid uuid)
returns boolean as $$
  select exists (
    select 1 from business_users
    where business_id = bid
      and user_id = auth.uid()
  );
$$ language sql security definer;
```

### bookings RLS
```sql
-- Customers see only their own bookings
create policy "customers_view_own_bookings" on bookings
  for select using (customer_id = auth.uid());

-- Admins see all bookings for their business
create policy "admins_view_business_bookings" on bookings
  for select using (is_business_admin(business_id));

-- Customers can insert bookings
create policy "customers_insert_bookings" on bookings
  for insert with check (customer_id = auth.uid());

-- Only admins can update status
create policy "admins_update_bookings" on bookings
  for update using (is_business_admin(business_id));
```

### services / packages RLS
```sql
-- Public read for active services
create policy "public_read_services" on services
  for select using (is_active = true);

-- Only admins can write
create policy "admins_manage_services" on services
  for all using (is_business_admin(business_id));
```

### reviews RLS
```sql
-- Only customers with an approved booking can insert
create policy "customers_insert_reviews" on reviews
  for insert with check (
    customer_id = auth.uid()
    and exists (
      select 1 from bookings
      where id = reviews.booking_id
        and customer_id = auth.uid()
        and status = 'approved'
    )
  );

-- Public read
create policy "public_read_reviews" on reviews
  for select using (true);
```

### promo_codes RLS
```sql
-- Only admins can manage promo codes
create policy "admins_manage_promos" on promo_codes
  for all using (is_business_admin(business_id));

-- Customers can read active codes (to validate)
create policy "customers_read_promos" on promo_codes
  for select using (is_active = true);
```
