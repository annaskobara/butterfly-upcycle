import { createContext, useContext, useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Order, OrderCreateInput, OrderStatus } from "../types/product";
import { adminHeaders, parseErrorMessage } from "./ProductsContext";
import { getApiUrl } from "../utils/api";

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
      const res = await fetch(getApiUrl("/api/orders"), { headers: adminHeaders() });
      if (!res.ok) {
        throw new Error(await parseErrorMessage(res, "Не вдалося завантажити замовлення"));
      }
      const data = (await res.json()) as Order[];
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося завантажити замовлення");
    } finally {
      setLoading(false);
    }
  }, []);

  const placeOrder = useCallback(async (input: OrderCreateInput): Promise<Order> => {
    const res = await fetch(getApiUrl("/api/orders"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, "Не вдалося надіслати замовлення"));
    }
    const createdOrder = (await res.json()) as Order;
    setOrders((prev) => [createdOrder, ...prev]);
    return createdOrder;
  }, []);

  const setOrderStatus = useCallback(async (id: string, status: OrderStatus) => {
    const res = await fetch(getApiUrl(`/api/orders/${id}`), {
      method: "PATCH",
      headers: { ...adminHeaders(), "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, "Не вдалося оновити статус"));
    }
    const updated = (await res.json()) as Order;
    setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
  }, []);

  const deleteOrder = useCallback(async (id: string) => {
    const res = await fetch(getApiUrl(`/api/orders/${id}`), {
      method: "DELETE",
      headers: adminHeaders(),
    });
    if (!res.ok && res.status !== 204) {
      throw new Error(await parseErrorMessage(res, "Не вдалося видалити замовлення"));
    }
    setOrders((prev) => prev.filter((o) => o.id !== id));
  }, []);

  const value = useMemo<OrdersContextValue>(
    () => ({
      orders,
      loading,
      error,
      fetchOrders,
      placeOrder,
      setOrderStatus,
      deleteOrder,
    }),
    [orders, loading, error, fetchOrders, placeOrder, setOrderStatus, deleteOrder]
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