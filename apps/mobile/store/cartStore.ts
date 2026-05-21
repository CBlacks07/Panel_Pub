import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type CartItem = {
  id: string;
  title: string;
  price: number;
  image_url: string | null;
  selectedSize: string | null;
  selectedColor: string | null;
  quantity: number;
};

type ShopCart = {
  items: CartItem[];
};

type CartStore = {
  // clé = shopId, valeur = liste d'articles
  carts: Record<string, ShopCart>;

  getItems: (shopId: string) => CartItem[];
  addItem: (shopId: string, item: CartItem) => void;
  removeItem: (shopId: string, itemId: string) => void;
  clear: (shopId: string) => void;
  total: (shopId: string) => number;
  count: (shopId: string) => number;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      carts: {},

      getItems: (shopId) => get().carts[shopId]?.items ?? [],

      addItem: (shopId, item) => {
        const current = get().carts[shopId]?.items ?? [];
        const existing = current.find(
          (i) => i.id === item.id && i.selectedSize === item.selectedSize && i.selectedColor === item.selectedColor
        );
        const updated = existing
          ? current.map((i) =>
              i.id === item.id && i.selectedSize === item.selectedSize && i.selectedColor === item.selectedColor
                ? { ...i, quantity: i.quantity + 1 }
                : i
            )
          : [...current, item];

        set((state) => ({
          carts: { ...state.carts, [shopId]: { items: updated } },
        }));
      },

      removeItem: (shopId, itemId) => {
        const current = get().carts[shopId]?.items ?? [];
        set((state) => ({
          carts: {
            ...state.carts,
            [shopId]: { items: current.filter((i) => i.id !== itemId) },
          },
        }));
      },

      clear: (shopId) => {
        set((state) => ({
          carts: { ...state.carts, [shopId]: { items: [] } },
        }));
      },

      total: (shopId) => {
        const items = get().carts[shopId]?.items ?? [];
        return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      },

      count: (shopId) => get().carts[shopId]?.items.length ?? 0,
    }),
    {
      name: "boutiki-carts",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
