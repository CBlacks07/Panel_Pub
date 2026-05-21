export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          shop_name: string;
          phone_whatsapp: string | null;
          plan: "free" | "pro" | "annual";
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          shop_name: string;
          phone_whatsapp?: string | null;
          plan?: "free" | "pro" | "annual";
        };
        Update: {
          shop_name?: string;
          phone_whatsapp?: string | null;
          plan?: "free" | "pro" | "annual";
        };
      };
      products: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          price: number;
          description: string | null;
          category: string;
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          title: string;
          price: number;
          description?: string | null;
          category: string;
          image_url?: string | null;
        };
        Update: {
          title?: string;
          price?: number;
          description?: string | null;
          category?: string;
          image_url?: string | null;
        };
      };
      product_variations: {
        Row: {
          id: string;
          product_id: string;
          type: "size" | "color" | "other";
          value: string;
          stock: number | null;
        };
        Insert: {
          product_id: string;
          type: "size" | "color" | "other";
          value: string;
          stock?: number | null;
        };
        Update: {
          value?: string;
          stock?: number | null;
        };
      };
    };
  };
};
