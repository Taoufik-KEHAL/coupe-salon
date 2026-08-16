import type { CartItem, ServiceProduct } from '@/types';
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type CartContextValue = {
  items: CartItem[];
  total: number;
  totalDurationMinutes: number;
  hasServices: boolean;
  addItem: (item: ServiceProduct) => void;
  increment: (id: string) => void;
  decrement: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const value: CartContextValue = {
    items,
    total: useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items]),
    totalDurationMinutes: useMemo(
      () => items.reduce((sum, i) => sum + (i.durationMinutes ?? 0) * i.quantity, 0),
      [items]
    ),
    hasServices: items.some((i) => i.kind === 'service'),
    addItem: (item) =>
      setItems((prev) => {
        const existing = prev.find((i) => i.id === item.id);
        if (existing) {
          return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
        }
        return [
          ...prev,
          {
            id: item.id,
            kind: item.type,
            name: item.name,
            price: item.price,
            photoUrl: item.photoUrl,
            durationMinutes: item.durationMinutes,
            quantity: 1,
          },
        ];
      }),
    increment: (id) =>
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: i.quantity + 1 } : i))),
    decrement: (id) =>
      setItems((prev) =>
        prev
          .map((i) => (i.id === id ? { ...i, quantity: i.quantity - 1 } : i))
          .filter((i) => i.quantity > 0)
      ),
    remove: (id) => setItems((prev) => prev.filter((i) => i.id !== id)),
    clear: () => setItems([]),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
