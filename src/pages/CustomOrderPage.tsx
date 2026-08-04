import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useProducts } from "../context/ProductsContext";
import { useOrders } from "../context/OrdersContext";
import "./CustomOrderPage.scss";

export default function CustomOrderPage() {
  const [searchParams] = useSearchParams();
  const refId = searchParams.get("ref");
  const { getProduct } = useProducts();
  const refProduct = refId ? getProduct(refId) : undefined;
  const { placeOrder } = useOrders();

  const [description, setDescription] = useState(
    refProduct ? `Хочу щось схоже на "${refProduct.title}"` : ""
  );
  const [budget, setBudget] = useState("");
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
      <section className="custom-order">
        <div className="container custom-order__done">
          <p className="eyebrow">Дякуємо!</p>
          <h1>Заявку надіслано</h1>
          <p>
            Опрацюю вашу ідею й відповім у Telegram або Instagram протягом
            дня, щоб обговорити деталі та терміни.
          </p>
          <Link to="/catalog" className="btn btn--outline">
            Повернутись до каталогу
          </Link>
        </div>
      </section>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!description.trim() || !name.trim() || !contact.trim()) {
      setError("Опишіть бажану річ і вкажіть ім'я та контакт для зв'язку.");
      return;
    }

    setSubmitting(true);
    try {
      await placeOrder({
        type: "custom",
        description: description.trim(),
        budget: budget ? Number(budget) : undefined,
        name: name.trim(),
        phone: phone.trim(),
        contact: contact.trim(),
        city: city.trim(),
        notes: notes.trim(),
      });
      setDone(true);
      window.scrollTo({ top: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося надіслати заявку.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="custom-order">
      <div className="container">
        <p className="eyebrow">Заявка</p>
        <h1 className="custom-order__title">
          Розкажіть про вашу <span className="italic-accent">ідею</span>.
        </h1>
        <p className="custom-order__lead">
          Індивідуальне замовлення — під ваші мірки, з обраних тканин або
          матеріалів на вибір. Заповніть коротку форму, і я відповім у
          Telegram або Instagram протягом дня. Консультація безкоштовна.
        </p>

        <form className="custom-order-form" onSubmit={handleSubmit}>
          <label className="custom-order-form__field">
            <span>Що б ви хотіли замовити</span>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Наприклад: асиметрична спідниця з деніму до 15 серпня"
              required
            />
          </label>

          <div className="custom-order-form__row">
            <label className="custom-order-form__field">
              <span>Орієнтовний бюджет, грн (необов'язково)</span>
              <input
                type="number"
                min={0}
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="1500"
              />
            </label>
            <label className="custom-order-form__field">
              <span>Ваше ім'я</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Наприклад, Наталія"
                required
              />
            </label>
          </div>

          <div className="custom-order-form__row">
            <label className="custom-order-form__field">
              <span>Телефон</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+380..."
              />
            </label>
            <label className="custom-order-form__field">
              <span>Telegram / Instagram</span>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="@нікнейм"
                required
              />
            </label>
          </div>

          <label className="custom-order-form__field">
            <span>Місто (необов'язково)</span>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Дніпро · доставка Україною"
            />
          </label>

          <label className="custom-order-form__field">
            <span>Побажання, референси, дедлайн</span>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Розмір, тканина, стиль, коли треба готове"
            />
          </label>

          {error && <p className="custom-order-form__error">{error}</p>}

          <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
            {submitting ? "Надсилаю…" : "Надіслати заявку"}
          </button>
        </form>
      </div>
    </section>
  );
}
