import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useProducts } from "../context/ProductsContext";
import ProductCard from "./ProductCard";
import "./Categories.scss";

// Mobile shows one card at a time, tablets two, desktop three — matches the
// grid column breakpoints in Categories.scss (640px / 1024px).
function useCarouselPageSize() {
  const [pageSize, setPageSize] = useState(() => {
    if (typeof window === "undefined") return 3;
    if (window.innerWidth < 640) return 1;
    if (window.innerWidth < 1024) return 2;
    return 3;
  });

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 639px)");
    const tablet = window.matchMedia("(min-width: 640px) and (max-width: 1023px)");

    const update = () => {
      if (mobile.matches) setPageSize(1);
      else if (tablet.matches) setPageSize(2);
      else setPageSize(3);
    };

    update();
    mobile.addEventListener("change", update);
    tablet.addEventListener("change", update);
    return () => {
      mobile.removeEventListener("change", update);
      tablet.removeEventListener("change", update);
    };
  }, []);

  return pageSize;
}

export default function Categories() {
  const { products, loading } = useProducts();
  const pageSize = useCarouselPageSize();
  const [page, setPage] = useState(0);

  const ordered = useMemo(
    () => products.filter((p) => p.inStock),
    [products]
  );

  const pageCount = Math.max(1, Math.ceil(ordered.length / pageSize));
  // Keep the current page in range if the page size changes (e.g. rotating
  // a tablet) or the product list shrinks.
  const safePage = Math.min(page, pageCount - 1);
  const current = ordered.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const goPrev = () => setPage((safePage - 1 + pageCount) % pageCount);
  const goNext = () => setPage((safePage + 1) % pageCount);

  return (
    <section className="categories" id="categories">
      <div className="container">
        <div className="categories__header">
          <div>
            <p className="eyebrow">Категорії</p>
            <h2 className="categories__title">Що можна замовити</h2>
            <p className="categories__subtitle">
              Ціни орієнтовні — фінальна залежить від тканин, складності крою й
              термінів.
            </p>
          </div>
          <Link to="/catalog" className="btn btn--outline categories__cta">
            Дивитись каталог
          </Link>
        </div>

        <div className="categories__carousel">
          {!loading && ordered.length === 0 && (
            <p className="categories__empty">
              Зараз усі готові речі розібрані — загляньте в каталог, там
              видно й продані роботи, або залиште заявку на схожу річ.
            </p>
          )}

          <div className="categories__grid">
            {!loading &&
              current.map((product) => (
                <ProductCard product={product} key={product.id} />
              ))}
          </div>

          {!loading && pageCount > 1 && (
            <div className="categories__nav">
              <button type="button" onClick={goPrev} aria-label="Попередні">
                ←
              </button>
              <div className="categories__dots">
                {Array.from({ length: pageCount }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`categories__dot${i === safePage ? " categories__dot--active" : ""}`}
                    onClick={() => setPage(i)}
                    aria-label={`Сторінка ${i + 1}`}
                  />
                ))}
              </div>
              <button type="button" onClick={goNext} aria-label="Наступні">
                →
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
