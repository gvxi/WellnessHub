export type PriceTier = {
  label: string;
  labelAr?: string;
  price: string;
  numericPrice: number;
};

export type ServiceItem = {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  groupLabel?: string;
  groupLabelAr?: string;
  price?: string;
  numericPrice?: number;
  tiers?: PriceTier[];
  note?: string;
  unsplashId?: string;
  imageUrl?: string;
  icon?: string;
};

export type SubCategory = {
  title: string;
  titleAr?: string;
  items: ServiceItem[];
  note?: string;
};

export type Category = {
  id: string;
  title: string;
  titleAr?: string;
  subtitle: string;
  subtitleAr?: string;
  unsplashId: string;
  imageUrl?: string;
  subs: SubCategory[];
};
