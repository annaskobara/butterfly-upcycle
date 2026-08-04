import { createContext, useContext, useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Product, ProductInput } from "../types/product";

export const ADMIN_AUTH_KEY = "butterfly-upcycle:admin-password";

function buildFormData(input: ProductInput, newImages: File[]): FormData {
  const fd = new FormData();
  fd.append("title", input.title);
  fd.append("category", input.category);
  fd.append("price", String(input.price));
  fd.append("inStock", String(input.inStock));
  fd.append("description", input.description);
  fd.append("details", input.details);
  fd.append("fabric", input.fabric);
  fd.append("sizes", input.sizes);
  fd.append("swatch", input.swatch);
  fd.append("accent", input.accent);
  fd.append("waterLiters", String(input.waterLiters));
  fd.append("fabricKg", String(input.fabricKg));
  fd.append("co2Kg", String(input.co2Kg));
  if (input.existingImages) {
    fd.append("existingImages", JSON.stringify(input.existingImages));
  }
  newImages.forEach((file) => fd.append("images", file));
  return fd;
}

export function adminHeaders(): HeadersInit {
  const password = window.sessionStorage.getItem(ADMIN_AUTH_KEY) || "";
  return { "x-admin-password": password };
}

export async function parseErrorMessage(res: Response, fallback: string) {
  try {
    const data = await res.json();
    return data.error || fallback;
  } catch {
    return fallback;
  }
}

interface ProductsContextValue {
  products: Product[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addProduct: (input: ProductInput, newImages: File[]) => Promise<Product>;
  updateProduct: (id: string, input: ProductInput, newImages: File[]) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
  getProduct: (id: string) => Product | undefined;
  categories: string[];
  addCategory: (name: string) => Promise<void>;
  deleteCategory: (name: string) => Promise<void>;
}

const ProductsContext = createContext<ProductsContextValue | null>(null);

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/categories"),
      ]);
      if (!productsRes.ok) throw new Error("Не вдалося завантажити товари з сервера");
      if (!categoriesRes.ok) throw new Error("Не вдалося завантажити категорії з сервера");
      setProducts((await productsRes.json()) as Product[]);
      setCategories((await categoriesRes.json()) as string[]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Не вдалося з'єднатися з сервером. Перевірте, чи запущено бекенд."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo<ProductsContextValue>(
    () => ({
      products,
      loading,
      error,
      refresh,
      categories,
      addProduct: async (input, newImages) => {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: adminHeaders(),
          body: buildFormData(input, newImages),
        });
        if (!res.ok) {
          throw new Error(await parseErrorMessage(res, "Не вдалося додати товар"));
        }
        const product = (await res.json()) as Product;
        setProducts((prev) => [product, ...prev]);
        return product;
      },
      updateProduct: async (id, input, newImages) => {
        const res = await fetch(`/api/products/${id}`, {
          method: "PUT",
          headers: adminHeaders(),
          body: buildFormData(input, newImages),
        });
        if (!res.ok) {
          throw new Error(await parseErrorMessage(res, "Не вдалося зберегти зміни"));
        }
        const product = (await res.json()) as Product;
        setProducts((prev) => prev.map((p) => (p.id === id ? product : p)));
        return product;
      },
      deleteProduct: async (id) => {
        const res = await fetch(`/api/products/${id}`, {
          method: "DELETE",
          headers: adminHeaders(),
        });
        if (!res.ok && res.status !== 204) {
          throw new Error(await parseErrorMessage(res, "Не вдалося видалити товар"));
        }
        setProducts((prev) => prev.filter((p) => p.id !== id));
      },
      getProduct: (id) => products.find((p) => p.id === id),
      addCategory: async (name) => {
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { ...adminHeaders(), "content-type": "application/json" },
          body: JSON.stringify({ name }),
        });
        if (!res.ok) {
          throw new Error(await parseErrorMessage(res, "Не вдалося додати категорію"));
        }
        setCategories((await res.json()) as string[]);
      },
      deleteCategory: async (name) => {
        const res = await fetch(`/api/categories/${encodeURIComponent(name)}`, {
          method: "DELETE",
          headers: adminHeaders(),
        });
        if (!res.ok) {
          throw new Error(await parseErrorMessage(res, "Не вдалося видалити категорію"));
        }
        setCategories((await res.json()) as string[]);
      },
    }),
    [products, categories, loading, error, refresh]
  );

  return (
    <ProductsContext.Provider value={value}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) {
    throw new Error("useProducts must be used within a ProductsProvider");
  }
  return ctx;
}
