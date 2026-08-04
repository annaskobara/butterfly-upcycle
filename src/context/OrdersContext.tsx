import { createContext, useContext, useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Order, OrderCreateInput, OrderStatus } from "../types/product";
import { adminHeaders, parseErrorMessage } from "./ProductsContext";

const API_URL = import.meta.env.VITE_API_URL || "";

interface OrdersContextValue {
  orders: Order[];
  loading: boolean;
  error: string | null;
  placeOrder: (input: OrderCreateInput) => Promise<Order>;
  fetchOrders: () => Promise<void>;
  setOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
}

const OrdersContext = createContext<OrdersContextValue | null>(null);

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/orders`, { headers: adminHeaders() });
      if (!res.ok) {
        throw new Error(await parseErrorMessage(res, "Не вдалося завантажити замовлення"));
      }
      setOrders((await res.json()) as Order[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося завантажити замовлення");
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo<OrdersContextValue>(
    () => ({
      orders,
      loading,
      error,
      fetchOrders,
      placeOrder: async (input) => {
        const res = await fetch(`${API_URL}/api/orders`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(input),
        });
        if (!res.ok) {
          throw new Error(await parseErrorMessage(res, "Не вдалося надіслати замовлення"));
        }
        return (await res.json()) as Order;
      },
      setOrderStatus: async (id, status) => {
        const res = await fetch(`${API_URL}/api/orders/${id}`, {
          method: "PATCH",
          headers: { ...adminHeaders(), "content-type": "application/json" },
          body: JSON.stringify({ status }),
        });
        if (!res.ok) {
          throw new Error(await parseErrorMessage(res, "Не вдалося оновити статус"));
        }
        const updated = (await res.json()) as Order;
        setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
      },
      deleteOrder: async (id) => {
        const res = await fetch(`${API_URL}/api/orders/${id}`, {
          method: "DELETE",
          headers: adminHeaders(),
        });
        if (!res.ok && res.status !== 204) {
          throw new Error(await parseErrorMessage(res, "Не вдалося видалити замовлення"));
        }
        setOrders((prev) => prev.filter((o) => o.id !== id));
      },
    }),
    [orders, loading, error, fetchOrders]
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) {
    throw new Error("useOrders must be used within an OrdersProvider");
  }
  return ctx;
}