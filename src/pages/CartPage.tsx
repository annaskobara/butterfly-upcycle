import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useOrders } from "../context/OrdersContext";
import "./CartPage.scss";

function formatPrice(price: number) {
  return `${price.toLocaleString("uk-UA")} грн`;
}

export default function CartPage() {
  const { items, total, removeItem, clear } = useCart();
  const { placeOrder } = useOrders();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [contact, setContact] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <section className="cart-page">
        <div className="container cart-page__done">
          <p className="eyebrow">Дякуємо!</p>
          <h1>Замовлення надіслано</h1>
          <p>
            Зв'яжуся з вами найближчим часом за вказаним контактом, щоб
            узгодити оплату й доставку.
          </p>
          <Link to="/catalog" className="btn btn--outline">
            Повернутись до каталогу
          </Link>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="cart-page">
        <div className="container cart-page__done">
          <p className="eyebrow">Кошик</p>
          <h1>Кошик порожній</h1>
          <p>Додайте щось із каталогу наявних робіт.</p>
          <Link to="/catalog" className="btn btn--primary">
            Дивитись каталог
          </Link>
        </div>
      </section>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !contact.trim()) {
      setError("Вкажіть ім'я і контакт для зв'язку (телефон, Telegram або Instagram).");
      return;
    }

    setSubmitting(true);
    try {
      await placeOrder({
        type: "purchase",
        items: items.map((i) => ({ productId: i.productId })),
        name: name.trim(),
        phone: phone.trim(),
        contact: contact.trim(),
        city: city.trim(),
        notes: notes.trim(),
      });
      clear();
      setDone(true);
      window.scrollTo({ top: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося надіслати замовлення.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="cart-page">
      <div className="container">
        <button className="cart-page__back" type="button" onClick={() => navigate(-1)}>
          ← Назад
        </button>

        <p className="eyebrow">Кошик</p>
        <h1 className="cart-page__title">Оформлення замовлення</h1>

        <div className="cart-page__layout">
          <div className="cart-page__items">
            <ul>
              {items.map((item) => (
                <li key={item.productId} className="cart-item">
                  <div
                    className="cart-item__image"
                    style={
                      item.image
                        ? { background: `url(${item.image}) center/cover no-repeat` }
                        : undefined
                    }
                    aria-hidden="true"
                  />
                  <div className="cart-item__info">
                    <strong>{item.title}</strong>
                    <span>{formatPrice(item.price)}</span>
                  </div>
                  <button
                    type="button"
                    className="cart-item__remove"
                    onClick={() => removeItem(item.productId)}
                    aria-label="Прибрати з кошика"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
            <div className="cart-page__total">
              <span>Разом</span>
              <strong>{formatPrice(total)}</strong>
            </div>
          </div>

          <form className="cart-form" onSubmit={handleSubmit}>
            <label className="cart-form__field">
              <span>Ваше ім'я</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Наприклад, Наталія"
                required
              />
            </label>

            <label className="cart-form__field">
              <span>Телефон</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+380..."
              />
            </label>

            <label className="cart-form__field">
              <span>Telegram / Instagram (для зв'язку та оплати)</span>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="@нікнейм"
                required
              />
            </label>

            <label className="cart-form__field">
              <span>Місто і відділення Нової Пошти</span>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Наприклад, Дніпро, відділення №5"
              />
            </label>

            <label className="cart-form__field">
              <span>Коментар (необов'язково)</span>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Побажання щодо доставки чи оплати"
              />
            </label>

            {error && <p className="cart-form__error">{error}</p>}

            <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
              {submitting ? "Надсилаю…" : `Підтвердити замовлення · ${formatPrice(total)}`}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
