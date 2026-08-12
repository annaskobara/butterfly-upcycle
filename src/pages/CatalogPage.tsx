import { useMemo, useState } from "react";
import { useProducts } from "../context/ProductsContext";
import ProductCard from "../components/ProductCard";
import "./CatalogPage.scss";

const ALL = "Усі";

export default function CatalogPage() {
  const { products, categories, loading, error } = useProducts();
  const [activeCategory, setActiveCategory] = useState<string>(ALL);
  const [onlyInStock, setOnlyInStock] = useState(false);

  const filters = useMemo(() => [ALL, ...categories], [categories]);

  const filtered = useMemo(
    () =>
      products
        .filter((p) => activeCategory === ALL || p.category === activeCategory)
        .filter((p) => !onlyInStock || p.inStock),
    [products, activeCategory, onlyInStock]
  );

  return (
    <section className="catalog-page">
      <div className="container">
        <p className="eyebrow">Каталог</p>
        <h1 className="catalog-page__title">Наявні роботи</h1>
        <p className="catalog-page__subtitle">
          Готові речі та приклади минулих замовлень. Кожна — в одному
          екземплярі; якщо річ вже продана, можу пошити подібну під ваші
          мірки.
        </p>

        <div className="catalog-page__controls">
          <div className="catalog-page__filters">
            {filters.map((f) => (
              <button
                key={f}
                className={`catalog-page__filter${
                  activeCategory === f ? " catalog-page__filter--active" : ""
                }`}
                onClick={() => setActiveCategory(f)}
                type="button"
              >
                {f}
              </button>
            ))}
          </div>

          <label className="catalog-page__toggle">
            <input
              type="checkbox"
              checked={onlyInStock}
              onChange={(e) => setOnlyInStock(e.target.checked)}
            />
            <span>Лише в наявності</span>
          </label>
        </div>

        {loading && <p className="catalog-page__status">Завантажую каталог…</p>}

        {error && (
          <p className="catalog-page__status catalog-page__status--error">
            {error}
          </p>
        )}

        {!loading && !error && filtered.length === 0 && (
          <p className="catalog-page__empty">
            У цій категорії поки що немає виробів.
          </p>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="catalog-page__grid">
            {filtered.map((product) => (
              <ProductCard product={product} key={product.id} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
