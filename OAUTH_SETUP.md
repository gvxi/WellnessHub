# Google OAuth Setup with Supabase

## 1. Google Cloud Console

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Navigate to **APIs & Services → OAuth consent screen**
   - User type: **External**
   - Fill: App name, support email, developer email
   - Scopes: add `email`, `profile`, `openid`
   - Save
4. Navigate to **APIs & Services → Credentials → Create Credentials → OAuth Client ID**
   - Application type: **Web application**
   - Name: `WellnessHub`
   - **Authorized JavaScript origins:**
     ```
     http://localhost:3000
     https://YOUR_PRODUCTION_DOMAIN.com
     ```
   - **Authorized redirect URIs:**
     ```
     https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback
     ```
     > Replace `YOUR_SUPABASE_PROJECT_REF` with your project ref from Supabase dashboard URL.
     > For production also add: `https://YOUR_PRODUCTION_DOMAIN.com/auth/callback`
5. Click **Create** → copy **Client ID** and **Client Secret**

---

## 2. Supabase Dashboard

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → your project
2. Navigate to **Authentication → Providers → Google**
3. Toggle **Enable Google provider** ON
4. Paste your **Client ID** and **Client Secret** from step 1
5. Copy the **Callback URL** shown — this must match what you entered in Google Console
6. Save

---

## 3. Environment Variables

Add to your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

Both values are in **Supabase Dashboard → Settings → API**.

---

## 4. How It Works in This App

The `AuthModal` component (`components/ui/AuthModal.tsx`) already calls:

```typescript
supabase.auth.signInWithOAuth({
  provider: "google",
  options: { redirectTo: window.location.href },
})
```

This opens Google's OAuth popup, redirects back to the current page after sign-in, and Supabase handles the session automatically.

---

## 5. Profile Table (already migrated)

After OAuth sign-in, users land on the **profile completion step** in the auth modal. Data is saved to:

```sql
public.profiles (id, username, phone, age, avatar_url, created_at)
```

Row-level security is already configured — users can only read/write their own row.

---

## 6. Detecting Sign-In State

In any client component, use:

```typescript
import { supabase } from "@/lib/supabase/client";

const { data: { session } } = await supabase.auth.getSession();
// session.user.email, session.user.id, etc.
```

Or subscribe to changes:

```typescript
supabase.auth.onAuthStateChange((event, session) => {
  // event: "SIGNED_IN" | "SIGNED_OUT" | "TOKEN_REFRESHED"
});
```

---

## 7. Testing Locally

1. Start dev server: `npm run dev`
2. Open `http://localhost:3000`
3. Click **Sign In** in the nav
4. Click **Continue with Google**
5. Complete Google OAuth flow
6. Should return to app and show profile completion step

> If redirect fails, double-check the callback URL in Google Console exactly matches the Supabase callback URL (no trailing slash, correct project ref).

---

## 8. Common Issues

| Problem | Fix |
|---|---|
| `redirect_uri_mismatch` | Callback URL in Google Console doesn't exactly match Supabase's callback URL |
| `Error 400: invalid_request` | JavaScript origin not added to Google Console |
| Modal closes but user not signed in | Check Supabase provider is enabled and credentials are saved |
| Profile step not showing | Check `profiles` table exists and RLS policy is active |
| Works locally, fails in prod | Add production domain to Google Console authorized origins + redirect URIs |
