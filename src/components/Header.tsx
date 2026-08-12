import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import logoMark from "../assets/logo-mark.png";
import "./Header.scss";

export default function Header() {
  const { count } = useCart();

  return (
    <header className="header">
      <div className="container header__inner">
        <Link to="/" className="header__logo">
          <img className="header__logo-mark" src={logoMark} alt="" aria-hidden="true" />
          <span>
            butterfly <span className="italic-accent">upcycle</span>
          </span>
        </Link>
        <nav className="header__nav">
          <Link to="/cart" className="header__cart" aria-label="Кошик">
            <span className="header__cart-icon">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              {count > 0 && <span className="header__cart-count">{count}</span>}
            </span>
          </Link>
          <Link to="/catalog" className="btn btn--primary header__cta">
            Каталог
          </Link>
        </nav>
      </div>
    </header>
  );
}
