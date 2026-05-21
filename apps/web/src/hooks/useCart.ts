"use client";
import { useState, useEffect } from "react";

export type WebCartItem = {
  id: string;
  title: string;
  price: number;
  image_url: string | null;
  size?: string;
  color?: string;
  qty: number;
};

export function useCart(shopId: string) {
  const key = `boutiki-cart-${shopId}`;
  const [items, setItems] = useState<WebCartItem[]>([]);

  // Charger depuis localStorage au montage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) setItems(JSON.parse(saved));
    } catch {}
  }, [shopId]);

  // Sauvegarder à chaque changement
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch {}
  }, [items]);

  const addItem = (item: Omit<WebCartItem, "qty">) => {
    setItems((prev) => {
      const exists = prev.find((i) => i.id === item.id && i.size === item.size && i.color === item.color);
      if (exists) return prev.map((i) => i.id === item.id && i.size === item.size && i.color === item.color ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const removeItem = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));

  const clear = () => { setItems([]); localStorage.removeItem(key); };

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const count = items.length;

  return { items, addItem, removeItem, clear, total, count };
}
