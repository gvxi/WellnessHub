export type DbUser = {
  id: string;
  email: string;
  full_name: string | null;
  role: "customer" | "admin";
  preferred_language: string | null;
  created_at: string;
};

export type DbBusiness = {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  owner_id: string;
  working_hours: Record<string, unknown> | null;
  timezone: string;
  is_active: boolean;
  created_at: string;
};

// translations shape: { ar: { name?: string; subtitle?: string; description?: string; ... } }
export type Translations = Record<string, Record<string, string>>;

export type DbCategory = {
  id: string;
  business_id: string;
  name: string;
  subtitle: string | null;
  unsplash_id: string | null;
  image_url: string | null;
  slug: string | null;
  display_order: number;
  translations: Translations;
  created_at: string;
};

export type DbService = {
  id: string;
  business_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  group_label: string | null;
  note: string | null;
  unsplash_id: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  translations: Translations;
  created_at: string;
};

export type DbPackage = {
  id: string;
  service_id: string;
  business_id: string;
  name: string;
  description: string | null;
  sessions_count: number | null;
  price: number;
  currency: string;
  note: string | null;
  unsplash_id: string | null;
  image_url: string | null;
  icon: string | null;
  display_order: number;
  is_active: boolean;
  translations: Translations;
  created_at: string;
};

export type DbAd = {
  id: string;
  business_id: string;
  headline: string;
  subtitle: string | null;
  unsplash_id: string | null;
  image_url: string | null;
  badge_text: string | null;
  is_active: boolean;
  fullscreen_enabled: boolean;
  display_order: number;
  translations: Translations;
  created_at: string;
};

export type DbBooking = {
  id: string;
  business_id: string;
  customer_id: string;
  service_id: string | null;
  package_id: string | null;
  scheduled_at: string;
  status: "pending" | "approved" | "rejected" | "refunded";
  conflict_flag: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

// ─── API response shapes ───────────────────────────────────────────────────

export type ApiPackage = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  note: string | null;
  icon: string | null;
  display_order: number;
  translations: Translations;
};

export type ApiService = {
  id: string;
  name: string;
  description: string | null;
  group_label: string | null;
  unsplash_id: string | null;
  image_url?: string | null;
  packages: ApiPackage[];
  translations: Translations;
};

export type ApiGroup = {
  label: string;
  services: ApiService[];
};

export type ApiCategory = {
  id: string;
  name: string;
  subtitle: string | null;
  unsplash_id: string | null;
  image_url: string | null;
  slug: string | null;
  display_order: number;
  groups: ApiGroup[];
  translations: Translations;
};

export type ApiAd = {
  id: string;
  headline: string;
  subtitle: string | null;
  unsplash_id: string | null;
  image_url: string | null;
  badge_text: string | null;
  link_url: string | null;
  fullscreen_enabled: boolean;
  display_order: number;
  translations: Translations;
};

export type ApiBooking = {
  id: string;
  status: DbBooking["status"];
  scheduled_at: string;
  notes: string | null;
  conflict_flag: boolean;
  created_at: string;
  customer_name: string | null;
  customer_email: string | null;
  service_name: string | null;
  package_name: string | null;
};

export type ApiAnalytics = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  revenue: number;
  top_services: { service_name: string; count: number }[];
};
