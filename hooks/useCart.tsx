import type { CartItem, Product, Service } from '@/types';
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type CartContextValue = {
  items: CartItem[];
  total: number;
  addService: (service: Service) => void;
  addProduct: (product: Product) => void;
  increment: (id: string) => void;
  decrement: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (entry: Omit<CartItem, 'quantity'>) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === entry.id);
      if (existing) {
        return prev.map((i) => (i.id === entry.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...entry, quantity: 1 }];
    });
  };

  const value: CartContextValue = {
    items,
    total: useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items]),
    addService: (service) =>
      addItem({
        id: service.id,
        kind: 'service',
        name: service.name,
        price: service.price,
        photoUrl: service.photoUrl,
      }),
    addProduct: (product) =>
      addItem({
        id: product.id,
        kind: 'product',
        name: product.name,
        price: product.price,
        photoUrl: product.photoUrl,
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
