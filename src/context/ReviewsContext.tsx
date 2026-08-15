import { createContext, useContext, useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Review, ReviewInput } from "../types/product";
import { adminHeaders, parseErrorMessage, getApiUrl } from "./ProductsContext";

interface ReviewsContextValue {
  reviews: Review[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addReview: (input: ReviewInput, image?: File | null) => Promise<Review>;
  deleteReview: (id: string) => Promise<void>;
}

const ReviewsContext = createContext<ReviewsContextValue | null>(null);

export function ReviewsProvider({ children }: { children: ReactNode }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(getApiUrl("/api/reviews"));
      if (!res.ok) throw new Error("Не вдалося завантажити відгуки");
      setReviews((await res.json()) as Review[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося завантажити відгуки");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addReview = useCallback(async (input: ReviewInput, image?: File | null): Promise<Review> => {
    const fd = new FormData();
    fd.append("name", input.name);
    fd.append("text", input.text);
    if (image) fd.append("image", image);

    const res = await fetch(getApiUrl("/api/reviews"), {
      method: "POST",
      headers: adminHeaders(),
      body: fd,
    });
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, "Не вдалося додати відгук"));
    }
    const review = (await res.json()) as Review;
    setReviews((prev) => [review, ...prev]);
    return review;
  }, []);

  const deleteReview = useCallback(async (id: string): Promise<void> => {
    const res = await fetch(getApiUrl(`/api/reviews/${id}`), {
      method: "DELETE",
      headers: adminHeaders(),
    });
    if (!res.ok && res.status !== 204) {
      throw new Error(await parseErrorMessage(res, "Не вдалося видалити відгук"));
    }
    setReviews((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const value = useMemo<ReviewsContextValue>(
    () => ({
      reviews,
      loading,
      error,
      refresh,
      addReview,
      deleteReview,
    }),
    [reviews, loading, error, refresh, addReview, deleteReview]
  );

  return <ReviewsContext.Provider value={value}>{children}</ReviewsContext.Provider>;
}

export function useReviews() {
  const ctx = useContext(ReviewsContext);
  if (!ctx) {
    throw new Error("useReviews must be used within a ReviewsProvider");
  }
  return ctx;
}