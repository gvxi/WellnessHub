# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start dev server with Turbopack (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint (no test suite exists yet)
```

## Architecture

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Framer Motion · Supabase · next-intl

### Route structure

```
app/
  layout.tsx              # Root layout — Outfit font, bg-light/text-dark body
  page.tsx                # Home page — composes Nav + ServiceCategory sections + AdBanner + Footer
  globals.css             # Tailwind v4 @theme tokens (brand palette)
  (public)/
    _sections/            # Page sections used only by the home route
```

The `(public)` route group is a layout grouping — it does not add a URL segment.

### Data layer

All service/pricing content lives in **`lib/services-data.ts`** as a static typed export (`categories: Category[]`). The type hierarchy is:

```
Category → SubCategory[] → ServiceItem[]
                              ├── price: string (single price)
                              └── tiers: PriceTier[] (multi-tier, e.g. "30 min / 60 min")
```

The four top-level categories are destructured positionally in `app/page.tsx` (`[fitness, salon, advanced, nails]`). Order matters.

### Supabase clients

Two separate clients must be used depending on context:
- `lib/supabase/client.ts` — browser/client components (`createBrowserClient`)
- `lib/supabase/server.ts` — server components/actions (`createServerClient`, async, reads cookies)

Required env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Styling conventions

- **Tailwind v4** with `@theme inline` token definitions in `globals.css`. Color tokens: `primary` (#5A0F1B), `secondary` (#8E6A94), `accent` (#BFA6C9), `light` (#F2EDEE), `dark` (#0E0B0D).
- Use `cn()` from `lib/utils.ts` (clsx + tailwind-merge) for conditional class merging.
- Images come from Unsplash via `https://images.unsplash.com/{unsplashId}?...` — IDs are stored on data objects, not hardcoded in components.

### Animation pattern

Scroll-triggered animations use Framer Motion's `useInView` + `variants` (stagger children). The `Nav` uses `useScroll` + `useTransform` for a glass-blur effect that transitions from transparent-over-hero to a frosted light background on scroll.

### Path alias

`@/*` maps to the repo root (defined in `tsconfig.json` and consumed by Next.js).
