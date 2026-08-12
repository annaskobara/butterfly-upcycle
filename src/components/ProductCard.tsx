import { Link } from "react-router-dom";
import type { MouseEvent } from "react";
import type { Product } from "../types/product";
import { useCart } from "../context/CartContext";
import "./ProductCard.scss";

const swatchGradients: Record<Product["swatch"], string> = {
  denim: "linear-gradient(150deg, #1c1315 0%, #2a3a52 55%, #17222f 100%)",
  shirt: "linear-gradient(150deg, #1c1315 0%, #b9764a 55%, #17222f 100%)",
  scrunchie: "linear-gradient(150deg, #2a2224 0%, #8a3c47 45%, #c99a5b 100%)",
  custom: "",
};

function formatPrice(price: number) {
  return `${price.toLocaleString("uk-UA")} грн`;
}

export default function ProductCard({ product }: { product: Product }) {
  const { addItem, hasItem } = useCart();
  const cover = product.images?.[0];
  const background = cover
    ? `url(${cover}) center/cover no-repeat`
    : product.swatch === "custom"
    ? `linear-gradient(150deg, #1c1315 0%, ${product.accent || "#6d1f2e"} 55%, #17222f 100%)`
    : swatchGradients[product.swatch];

  const inCart = hasItem(product.id);

  const handleAddToCart = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
  };

  return (
    <Link
      to={`/catalog/${product.id}`}
      className={`product-card${product.inStock ? "" : " product-card--sold"}`}
    >
      <div className="product-card__image" style={{ background }} aria-hidden="true">
        {!product.inStock && (
          <span className="product-card__badge">Продано · можливий повтор</span>
        )}
      </div>
      <div className="product-card__body">
        <div className="product-card__row">
          <h3>{product.title}</h3>
          <span className="product-card__price">{formatPrice(product.price)}</span>
        </div>
        <p>{product.description}</p>
        {product.inStock && (
          <button
            type="button"
            className={`product-card__cart-btn${inCart ? " product-card__cart-btn--added" : ""}`}
            onClick={handleAddToCart}
            disabled={inCart}
          >
            {inCart ? "У кошику ✓" : "Додати в кошик"}
          </button>
        )}
      </div>
    </Link>
  );
}
