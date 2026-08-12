import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useProducts } from "../context/ProductsContext";
import { useCart } from "../context/CartContext";
import AnimatedNumber from "../components/AnimatedNumber";
import "./ProductPage.scss";

const swatchGradients: Record<string, string> = {
  denim: "linear-gradient(150deg, #1c1315 0%, #2a3a52 55%, #17222f 100%)",
  shirt: "linear-gradient(150deg, #1c1315 0%, #b9764a 55%, #17222f 100%)",
  scrunchie: "linear-gradient(150deg, #2a2224 0%, #8a3c47 45%, #c99a5b 100%)",
};

function formatPrice(price: number) {
  return `${price.toLocaleString("uk-UA")} грн`;
}

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProduct, loading } = useProducts();
  const { addItem, hasItem } = useCart();
  const product = id ? getProduct(id) : undefined;
  const [activeImage, setActiveImage] = useState(0);

  if (loading) {
    return (
      <section className="product-page">
        <div className="container">
          <p className="product-page__status">Завантажую…</p>
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="product-page">
        <div className="container product-page__missing">
          <p className="eyebrow">Каталог</p>
          <h1>Такого виробу не знайдено</h1>
          <p>Можливо, його вже прибрали з каталогу або замовили.</p>
          <Link to="/catalog" className="btn btn--outline">
            Повернутись до каталогу
          </Link>
        </div>
      </section>
    );
  }

  const gallery = product.images?.length ? product.images : [];
  const fallbackBackground =
    product.swatch === "custom"
      ? `linear-gradient(150deg, #1c1315 0%, ${product.accent || "#6d1f2e"} 55%, #17222f 100%)`
      : swatchGradients[product.swatch];

  const mainBackground = gallery[activeImage]
    ? `url(${gallery[activeImage]}) center/cover no-repeat`
    : fallbackBackground;

  const impactStats = [
    product.waterLiters > 0 && {
      key: "water",
      value: product.waterLiters,
      unit: "л",
      label: "води заощаджено",
    },
    product.fabricKg > 0 && {
      key: "fabric",
      value: product.fabricKg,
      unit: "кг",
      label: "тканини врятовано від сміття",
    },
    product.co2Kg > 0 && {
      key: "co2",
      value: product.co2Kg,
      unit: "кг",
      label: "CO₂ менше викинуто",
    },
  ].filter(Boolean) as { key: string; value: number; unit: string; label: string }[];

  const inCart = hasItem(product.id);

  const handlePrimaryAction = () => {
    if (product.inStock) {
      addItem(product);
      navigate("/cart");
    } else {
      navigate(`/custom-order?ref=${product.id}`);
    }
  };

  return (
    <section className="product-page">
      <div className="container">
        <button
          className="product-page__back"
          type="button"
          onClick={() => navigate(-1)}
        >
          ← Назад до каталогу
        </button>

        <div className="product-page__layout">
          <div className="product-page__gallery">
            <div
              className="product-page__image"
              style={{ background: mainBackground }}
              aria-hidden="true"
            >
              {!product.inStock && (
                <span className="product-page__badge">Продано · можливий повтор</span>
              )}
            </div>

            {gallery.length > 1 && (
              <div className="product-page__thumbs">
                {gallery.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    className={`product-page__thumb${
                      i === activeImage ? " product-page__thumb--active" : ""
                    }`}
                    style={{ backgroundImage: `url(${src})` }}
                    onClick={() => setActiveImage(i)}
                    aria-label={`Фото ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="product-page__info">
            <p className="eyebrow">{product.category}</p>
            <h1>{product.title}</h1>
            <p className="product-page__price">{formatPrice(product.price)}</p>
            <p className="product-page__description">
              {product.details || product.description}
            </p>

            <dl className="product-page__meta">
              {product.fabric && (
                <div>
                  <dt>Тканина</dt>
                  <dd>{product.fabric}</dd>
                </div>
              )}
              {product.sizes && (
                <div>
                  <dt>Розмір</dt>
                  <dd>{product.sizes}</dd>
                </div>
              )}
              <div>
                <dt>Наявність</dt>
                <dd>{product.inStock ? "В наявності" : "Продано, можливий повтор"}</dd>
              </div>
            </dl>

            {impactStats.length > 0 && (
              <dl className="product-page__impact">
                {impactStats.map((s) => (
                  <div key={s.key}>
                    <dt>
                      <AnimatedNumber value={s.value} /> {s.unit}
                    </dt>
                    <dd>{s.label}</dd>
                  </div>
                ))}
              </dl>
            )}

            <div className="product-page__actions">
              {product.inStock ? (
                <button
                  className="btn btn--primary"
                  type="button"
                  onClick={handlePrimaryAction}
                  disabled={inCart}
                >
                  {inCart ? "У кошику ✓" : "Додати в кошик"}
                </button>
              ) : (
                <button className="btn btn--primary" type="button" onClick={handlePrimaryAction}>
                  Замовити схоже
                </button>
              )}
              <Link to="/catalog" className="btn btn--outline">
                Дивитись каталог
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
