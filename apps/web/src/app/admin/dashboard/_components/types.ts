export type Config = Record<string, string>;

export type Shop = {
  id: string;
  shop_name: string;
  email: string;
  plan: string;
  created_at: string;
  suspended?: boolean;
  product_count?: number;
  avg_rating?: number;
  is_demo?: boolean;
};

export type Plan = {
  id: string;
  name: string;
  price: number;
  currency: string;
  billing: string;
  article_limit: number;
  edit_cooldown_hours?: number;
  features: string[];
  is_popular: boolean;
  active: boolean;
  sort_order?: number;
};

export type Stats = {
  shops: number;
  products: number;
  ratings: number;
  newShops7d: number;
  newShops30d: number;
  planCount: Record<string, number>;
  bizCount: Record<string, number>;
};

export type SectionId = "overview" | "shops" | "plans" | "config" | "security";

export const EMPTY_STATS: Stats = {
  shops: 0, products: 0, ratings: 0, newShops7d: 0, newShops30d: 0, planCount: {}, bizCount: {},
};
