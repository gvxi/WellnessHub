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

export type BookingSource = "Customer" | "POS" | "Admin";
export type PaymentMethodType = "Payment Gateway" | "Cash" | "POS Machine" | "QR/Transfer";

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
  booking_by: BookingSource;
  created_by_user_id: string | null;
  payment_method: PaymentMethodType;
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

export type ApiBookingCartItem = {
  name: string;
  name_ar?: string;
  qty: number;
  line_total: number;
  currency: string;
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
  customer_phone: string | null;
  service_name: string | null;
  service_translations: Translations | null;
  package_name: string | null;
  package_translations: Translations | null;
  cart_items: ApiBookingCartItem[] | null;
  total_amount: number | null;
  payment_reference: string | null;
  booking_by: BookingSource;
  created_by_user_id: string | null;
  created_by_name: string | null;
  created_by_email: string | null;
  payment_method: PaymentMethodType;
};

export type ApiAnalytics = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  revenue: number;
  top_services: { service_name: string; service_name_ar: string | null; count: number }[];
};

export type TabPermission = 'hidden' | 'read-only' | 'enabled';
export type PosUserType = 'main' | 'sub';

export type DbEmployeePermissions = {
  id: string;
  business_id: string;
  user_id: string;
  current_session_token: string | null;
  session_invalidated_at: string | null;
  can_edit_services: boolean;
  can_edit_ads: boolean;
  show_rejected_bookings: boolean;
  booking_delay_minutes: number;
  booking_filter_email: string | null;
  booking_filter_phone: string | null;
  is_active: boolean;
  tab_bookings: TabPermission;
  tab_services: TabPermission;
  tab_ads: TabPermission;
  tab_analytics: TabPermission;
  tab_settings: TabPermission;
  tab_about: TabPermission;
  pos_user_type: PosUserType;
  parent_user_id: string | null;
  can_create_sub_users: boolean;
  created_at: string;
  updated_at: string;
};

export type EmployeePermissions = {
  can_edit_services: boolean;
  can_edit_ads: boolean;
  show_rejected_bookings: boolean;
  booking_delay_minutes: number;
  booking_filter_email: string | null;
  booking_filter_phone: string | null;
  is_active: boolean;
  can_manage_bookings: boolean;
  tab_bookings: TabPermission;
  tab_services: TabPermission;
  tab_ads: TabPermission;
  tab_analytics: TabPermission;
  tab_settings: TabPermission;
  tab_about: TabPermission;
  pos_user_type: PosUserType;
  can_create_sub_users: boolean;
};

export type AboutField = { en: string; ar: string };

export type AboutData = {
  heroSubtitle: AboutField;
  heroHeadline: AboutField;
  heroBody: AboutField;
  exploreServices: AboutField;
  contactUs: AboutField;
  heroImageUnsplashId: string;
  heroImageUrl: string;
  whoWeAre: AboutField;
  missionHeadline: AboutField;
  missionP1: AboutField;
  missionP2: AboutField;
  missionImageUnsplashId: string;
  missionImageUrl: string;
  ourValues: AboutField;
  valuesHeadline: AboutField;
  val1Title: AboutField;
  val1Body: AboutField;
  val2Title: AboutField;
  val2Body: AboutField;
  val3Title: AboutField;
  val3Body: AboutField;
  stat1Value: string;
  stat2Value: string;
  stat3Value: string;
  stat1: AboutField;
  stat2: AboutField;
  stat3: AboutField;
  getInTouch: AboutField;
  contactHeadline: AboutField;
  location: AboutField;
  locationValue: AboutField;
  phone: AboutField;
  phoneValue: AboutField;
  instagram: AboutField;
  instagramValue: AboutField;
  hours: AboutField;
  hoursValue: AboutField;
  bookNow: AboutField;
};

export type ApiEmployee = {
  user_id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  can_edit_services: boolean;
  can_edit_ads: boolean;
  show_rejected_bookings: boolean;
  booking_delay_minutes: number;
  booking_filter_email: string | null;
  booking_filter_phone: string | null;
  can_manage_bookings: boolean;
  tab_bookings: TabPermission;
  tab_services: TabPermission;
  tab_ads: TabPermission;
  tab_analytics: TabPermission;
  tab_settings: TabPermission;
  tab_about: TabPermission;
  pos_user_type: PosUserType;
  parent_user_id: string | null;
  can_create_sub_users: boolean;
  parent_full_name: string | null;
  licence: string | null;
  real_email: string | null;
  phone: string | null;
  contract_path: string | null;
  document_paths: string[];
  created_at: string;
};
