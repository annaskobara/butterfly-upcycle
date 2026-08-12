import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useProducts, ADMIN_AUTH_KEY, adminHeaders } from "../context/ProductsContext";
import { useOrders } from "../context/OrdersContext";
import { useReviews } from "../context/ReviewsContext";
import type { Product, ProductInput, SwatchKey, OrderStatus } from "../types/product";
import "./AdminPage.scss";

// NOTE: the real password check happens on the backend (server/index.js,
// ADMIN_PASSWORD env var / default). This page just asks for it and stores
// it in sessionStorage to send along with add/edit/delete requests — it is
// not a replacement for real authentication.

const STATUS_LABELS: Record<OrderStatus, string> = {
  new: "Нове",
  confirmed: "Підтверджено",
  done: "Виконано",
};

function makeEmptyForm(defaultCategory: string): ProductInput {
  return {
    title: "",
    category: defaultCategory,
    price: 0,
    inStock: true,
    description: "",
    details: "",
    fabric: "",
    sizes: "",
    swatch: "custom",
    accent: "#6d1f2e",
    waterLiters: 0,
    fabricKg: 0,
    co2Kg: 0,
  };
}

function LoginGate({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setChecking(true);
    setError("");
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "x-admin-password": password },
      });
      if (!res.ok) {
        setError("Невірний пароль.");
        return;
      }
      window.sessionStorage.setItem(ADMIN_AUTH_KEY, password);
      onSuccess();
    } catch {
      setError("Не вдалося з'єднатися з сервером. Перевірте, чи запущено бекенд.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <section className="admin-login">
      <div className="container admin-login__inner">
        <p className="eyebrow">Адмін-панель</p>
        <h1>Вхід</h1>
        <form onSubmit={handleSubmit}>
          <label>
            <span>Пароль</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </label>
          {error && <p className="admin-login__error">{error}</p>}
          <button type="submit" className="btn btn--primary" disabled={checking}>
            {checking ? "Перевіряю…" : "Увійти"}
          </button>
        </form>
      </div>
    </section>
  );
}

interface ImagePreview {
  url: string;
  file?: File;
  isExisting: boolean;
}

type Tab = "products" | "categories" | "orders" | "reviews";

function ProductsTab() {
  const {
    products,
    categories,
    loading,
    error,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
  } = useProducts();

  const [form, setForm] = useState<ProductInput>(() =>
    makeEmptyForm(categories[0] || "")
  );
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Keep the default category in sync once categories load for the first time.
  useEffect(() => {
    if (!editingId && !form.category && categories.length > 0) {
      setForm((prev) => ({ ...prev, category: categories[0] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  useEffect(() => {
    if (!savedMessage) return;
    const t = setTimeout(() => setSavedMessage(""), 2500);
    return () => clearTimeout(t);
  }, [savedMessage]);

  useEffect(() => {
    return () => {
      imagePreviews.forEach((p) => {
        if (p.file) URL.revokeObjectURL(p.url);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = <K extends keyof ProductInput>(field: K, value: ProductInput[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm(makeEmptyForm(categories[0] || ""));
    setImagePreviews([]);
    setEditingId(null);
    setFormError("");
    setAddingCategory(false);
    setNewCategoryName("");
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files) return;
    const next = Array.from(files).map((file) => ({
      url: URL.createObjectURL(file),
      file,
      isExisting: false,
    }));
    setImagePreviews((prev) => [...prev, ...next]);
  };

  const removeImage = (index: number) => {
    setImagePreviews((prev) => {
      const target = prev[index];
      if (target?.file) URL.revokeObjectURL(target.url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    setImagePreviews((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleCategorySelect = (value: string) => {
    if (value === "__new__") {
      setAddingCategory(true);
      return;
    }
    update("category", value);
  };

  const confirmNewCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    try {
      await addCategory(name);
      update("category", name);
      setAddingCategory(false);
      setNewCategoryName("");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Не вдалося додати категорію.");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.title.trim() || form.price <= 0) {
      setFormError("Вкажіть назву і ціну товару.");
      return;
    }
    if (!form.category) {
      setFormError("Оберіть або додайте категорію.");
      return;
    }

    const existingImages = imagePreviews.filter((p) => p.isExisting).map((p) => p.url);
    const newFiles = imagePreviews
      .filter((p) => !p.isExisting && p.file)
      .map((p) => p.file as File);

    const payload: ProductInput = { ...form, existingImages };

    setSubmitting(true);
    try {
      if (editingId) {
        await updateProduct(editingId, payload, newFiles);
        setSavedMessage("Зміни збережено.");
      } else {
        await addProduct(payload, newFiles);
        setSavedMessage("Товар додано на сайт.");
      }
      resetForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Не вдалося зберегти товар.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
      title: product.title,
      category: product.category,
      price: product.price,
      inStock: product.inStock,
      description: product.description,
      details: product.details,
      fabric: product.fabric,
      sizes: product.sizes,
      swatch: product.swatch,
      accent: product.accent,
      waterLiters: product.waterLiters,
      fabricKg: product.fabricKg,
      co2Kg: product.co2Kg,
    });
    setImagePreviews((product.images || []).map((url) => ({ url, isExisting: true })));
    setFormError("");
    setAddingCategory(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Видалити цей товар з каталогу?")) return;
    try {
      await deleteProduct(id);
      if (editingId === id) resetForm();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Не вдалося видалити товар.");
    }
  };

  return (
    <>
      {error && <p className="admin-page__server-error">{error}</p>}

      <div className="admin-page__layout">
        <form className="admin-form" onSubmit={handleSubmit}>
          <h2>{editingId ? "Редагувати товар" : "Додати новий товар"}</h2>

          <label className="admin-form__field">
            <span>Назва</span>
            <input
              type="text"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="Наприклад, Печворк-спідниця з деніму"
              required
            />
          </label>

          <div className="admin-form__row">
            <label className="admin-form__field">
              <span>Категорія</span>
              <select value={form.category} onChange={(e) => handleCategorySelect(e.target.value)}>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="__new__">+ Додати нову категорію</option>
              </select>
            </label>

            <label className="admin-form__field">
              <span>Ціна, грн</span>
              <input
                type="number"
                min={0}
                value={form.price || ""}
                onChange={(e) => update("price", Number(e.target.value))}
                required
              />
            </label>
          </div>

          {addingCategory && (
            <div className="admin-form__inline-add">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Назва нової категорії"
                autoFocus
              />
              <button type="button" className="btn btn--outline" onClick={confirmNewCategory}>
                Додати
              </button>
            </div>
          )}

          <label className="admin-form__checkbox">
            <input
              type="checkbox"
              checked={form.inStock}
              onChange={(e) => update("inStock", e.target.checked)}
            />
            <span>Товар у наявності (можна замовити прямо зараз)</span>
          </label>

          <label className="admin-form__field">
            <span>Короткий опис (для картки)</span>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="1–2 речення для картки в каталозі"
            />
          </label>

          <label className="admin-form__field">
            <span>Детальний опис (для сторінки товару)</span>
            <textarea
              rows={3}
              value={form.details}
              onChange={(e) => update("details", e.target.value)}
            />
          </label>

          <div className="admin-form__row">
            <label className="admin-form__field">
              <span>Тканина</span>
              <input
                type="text"
                value={form.fabric}
                onChange={(e) => update("fabric", e.target.value)}
                placeholder="Наприклад, денім + бавовна"
              />
            </label>
            <label className="admin-form__field">
              <span>Розмір</span>
              <input
                type="text"
                value={form.sizes}
                onChange={(e) => update("sizes", e.target.value)}
                placeholder="Наприклад, M (46)"
              />
            </label>
          </div>

          <label className="admin-form__field">
            <span>Фото товару</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFilesSelected(e.target.files)}
            />
          </label>
          {imagePreviews.length > 1 && (
            <p className="admin-form__note">
              Перше фото — обкладинка картки товару. Стрілками можна змінити
              порядок.
            </p>
          )}

          {imagePreviews.length > 0 && (
            <div className="admin-form__previews">
              {imagePreviews.map((p, i) => (
                <div className="admin-form__preview" key={p.url + i}>
                  <img src={p.url} alt="" />
                  <button
                    type="button"
                    className="admin-form__preview-remove"
                    onClick={() => removeImage(i)}
                    aria-label="Видалити фото"
                  >
                    ×
                  </button>
                  <div className="admin-form__preview-order">
                    <button
                      type="button"
                      disabled={i === 0}
                      onClick={() => moveImage(i, -1)}
                      aria-label="Пересунути ліворуч"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      disabled={i === imagePreviews.length - 1}
                      onClick={() => moveImage(i, 1)}
                      aria-label="Пересунути праворуч"
                    >
                      →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {imagePreviews.length === 0 && (
            <div className="admin-form__row">
              <label className="admin-form__field">
                <span>Заглушка-колір (поки немає фото)</span>
                <select
                  value={form.swatch}
                  onChange={(e) => update("swatch", e.target.value as SwatchKey)}
                >
                  <option value="custom">Свій колір</option>
                  <option value="denim">Денім (синій)</option>
                  <option value="shirt">Сорочка (теракотовий)</option>
                  <option value="scrunchie">Аксесуари (бордо/золото)</option>
                </select>
              </label>
              {form.swatch === "custom" && (
                <label className="admin-form__field admin-form__field--color">
                  <span>Колір</span>
                  <input
                    type="color"
                    value={form.accent}
                    onChange={(e) => update("accent", e.target.value)}
                  />
                </label>
              )}
            </div>
          )}

          <h2 className="admin-form__subheading">Екологічний ефект речі</h2>
          <p className="admin-form__note">
            Показується невеликою анімованою статистикою на сторінці товару.
            Залиште 0, якщо не хочете показувати якийсь із показників.
          </p>
          <div className="admin-form__row admin-form__row--three">
            <label className="admin-form__field">
              <span>Води заощаджено, л</span>
              <input
                type="number"
                min={0}
                value={form.waterLiters || ""}
                onChange={(e) => update("waterLiters", Number(e.target.value))}
              />
            </label>
            <label className="admin-form__field">
              <span>Тканини врятовано, кг</span>
              <input
                type="number"
                min={0}
                step="0.1"
                value={form.fabricKg || ""}
                onChange={(e) => update("fabricKg", Number(e.target.value))}
              />
            </label>
            <label className="admin-form__field">
              <span>CO₂ заощаджено, кг</span>
              <input
                type="number"
                min={0}
                step="0.1"
                value={form.co2Kg || ""}
                onChange={(e) => update("co2Kg", Number(e.target.value))}
              />
            </label>
          </div>

          {formError && <p className="admin-form__error">{formError}</p>}

          <div className="admin-form__actions">
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting ? "Зберігаю…" : editingId ? "Зберегти зміни" : "Додати товар"}
            </button>
            {editingId && (
              <button type="button" className="btn btn--outline" onClick={resetForm}>
                Скасувати
              </button>
            )}
            {savedMessage && <span className="admin-form__saved">{savedMessage}</span>}
          </div>
        </form>

        <div className="admin-list">
          <h2>Усі товари ({products.length})</h2>
          {loading && <p className="admin-list__empty">Завантажую…</p>}
          <ul>
            {products.map((product) => (
              <li key={product.id} className="admin-list__item">
                <div>
                  <strong>
                    {product.title}
                    {!product.inStock && <span className="admin-list__sold"> · продано</span>}
                  </strong>
                  <span>
                    {product.category} · {product.price.toLocaleString("uk-UA")} грн
                  </span>
                </div>
                <div className="admin-list__actions">
                  <button type="button" onClick={() => handleEdit(product)}>
                    Редагувати
                  </button>
                  <button
                    type="button"
                    className="admin-list__delete"
                    onClick={() => handleDelete(product.id)}
                  >
                    Видалити
                  </button>
                </div>
              </li>
            ))}
            {!loading && products.length === 0 && (
              <li className="admin-list__empty">Товарів ще немає.</li>
            )}
          </ul>
        </div>
      </div>
    </>
  );
}

function CategoriesTab() {
  const { categories, products, addCategory, deleteCategory } = useProducts();
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const countFor = (category: string) =>
    products.filter((p) => p.category === category).length;

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await addCategory(trimmed);
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося додати категорію.");
    }
  };

  const handleDelete = async (category: string) => {
    const used = countFor(category);
    const message =
      used > 0
        ? `У цій категорії ${used} товар(ів). Видалити категорію зі списку? Самі товари залишаться, але категорію доведеться обрати заново.`
        : "Видалити цю категорію?";
    if (!window.confirm(message)) return;
    try {
      await deleteCategory(category);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Не вдалося видалити категорію.");
    }
  };

  return (
    <div className="admin-categories">
      <form className="admin-categories__add" onSubmit={handleAdd}>
        <label className="admin-form__field">
          <span>Нова категорія</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Наприклад, Верхній одяг"
          />
        </label>
        <button type="submit" className="btn btn--primary">
          Додати категорію
        </button>
      </form>
      {error && <p className="admin-form__error">{error}</p>}

      <ul className="admin-categories__list">
        {categories.map((c) => (
          <li key={c}>
            <div>
              <strong>{c}</strong>
              <span>{countFor(c)} товар(ів)</span>
            </div>
            <button type="button" className="admin-list__delete" onClick={() => handleDelete(c)}>
              Видалити
            </button>
          </li>
        ))}
        {categories.length === 0 && (
          <li className="admin-list__empty">Категорій ще немає.</li>
        )}
      </ul>
    </div>
  );
}

const ORDER_TYPE_LABELS: Record<string, string> = {
  purchase: "Товар",
  custom: "Індивідуальне",
};

const STATUS_FILTER_ALL = "Усі";

function OrdersTab() {
  const { orders, loading, error, fetchOrders, setOrderStatus, deleteOrder } = useOrders();
  const [statusFilter, setStatusFilter] = useState<string>(STATUS_FILTER_ALL);
  const [telegramConfigured, setTelegramConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    fetchOrders();
    fetch("/api/admin/telegram-status", { headers: adminHeaders() })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setTelegramConfigured(data ? data.configured : null))
      .catch(() => setTelegramConfigured(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Видалити це замовлення зі списку?")) return;
    try {
      await deleteOrder(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Не вдалося видалити замовлення.");
    }
  };

  const filtered =
    statusFilter === STATUS_FILTER_ALL
      ? orders
      : orders.filter((o) => o.status === statusFilter);

  return (
    <div className="admin-orders">
      <div className="admin-orders__header">
        <h2>Замовлення ({filtered.length})</h2>
        <div className="admin-orders__header-actions">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value={STATUS_FILTER_ALL}>Усі статуси</option>
            {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <button type="button" className="btn btn--outline" onClick={() => fetchOrders()}>
            Оновити
          </button>
        </div>
      </div>

      {telegramConfigured === false && (
        <p className="admin-orders__telegram-hint">
          Сповіщення в Telegram про нові замовлення вимкнені. Щоб отримувати
          їх у бот, задайте <code>TELEGRAM_BOT_TOKEN</code> і{" "}
          <code>TELEGRAM_CHAT_ID</code> у <code>server/.env</code> (детальніше
          в README).
        </p>
      )}

      {error && <p className="admin-page__server-error">{error}</p>}
      {loading && <p className="admin-list__empty">Завантажую…</p>}

      {!loading && filtered.length === 0 && (
        <p className="admin-list__empty">Замовлень із таким статусом немає.</p>
      )}

      <ul className="admin-orders__list">
        {filtered.map((order) => {
          const total = order.items.reduce((sum, item) => sum + item.price, 0);
          return (
            <li key={order.id} className="admin-orders__item">
              <div className="admin-orders__main">
                <span className="admin-orders__type">
                  {ORDER_TYPE_LABELS[order.type] || order.type}
                </span>
                <ul className="admin-orders__products">
                  {order.items.map((item, i) => (
                    <li key={i}>
                      {item.title}
                      {item.price > 0 && ` — ${item.price.toLocaleString("uk-UA")} грн`}
                    </li>
                  ))}
                </ul>
                {total > 0 && (
                  <span className="admin-orders__total">
                    Разом: {total.toLocaleString("uk-UA")} грн
                  </span>
                )}
              </div>
              <div className="admin-orders__details">
                <div>
                  <dt>Ім'я</dt>
                  <dd>{order.name}</dd>
                </div>
                {order.phone && (
                  <div>
                    <dt>Телефон</dt>
                    <dd>{order.phone}</dd>
                  </div>
                )}
                <div>
                  <dt>Контакт</dt>
                  <dd>{order.contact}</dd>
                </div>
                {order.city && (
                  <div>
                    <dt>Доставка</dt>
                    <dd>{order.city}</dd>
                  </div>
                )}
                {order.notes && (
                  <div>
                    <dt>Коментар</dt>
                    <dd>{order.notes}</dd>
                  </div>
                )}
                <div>
                  <dt>Дата</dt>
                  <dd>{new Date(order.createdAt).toLocaleString("uk-UA")}</dd>
                </div>
              </div>
              <div className="admin-orders__actions">
                <select
                  value={order.status}
                  onChange={(e) => setOrderStatus(order.id, e.target.value as OrderStatus)}
                >
                  {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="admin-list__delete"
                  onClick={() => handleDelete(order.id)}
                >
                  Видалити
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ReviewsTab() {
  const { reviews, loading, error, addReview, deleteReview } = useReviews();
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleImageSelected = (files: FileList | null) => {
    const file = files?.[0] || null;
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImage(file);
    setImagePreview(file ? URL.createObjectURL(file) : "");
  };

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImage(null);
    setImagePreview("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!name.trim() || !text.trim()) {
      setFormError("Вкажіть ім'я і текст відгуку.");
      return;
    }
    setSubmitting(true);
    try {
      await addReview({ name: name.trim(), text: text.trim() }, image);
      setName("");
      setText("");
      removeImage();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Не вдалося додати відгук.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Видалити цей відгук із сайту?")) return;
    try {
      await deleteReview(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Не вдалося видалити відгук.");
    }
  };

  return (
    <div className="admin-reviews">
      <form className="admin-form admin-reviews__form" onSubmit={handleSubmit}>
        <h2>Додати відгук</h2>
        <label className="admin-form__field">
          <span>Ім'я клієнтки/клієнта</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Наприклад, Марина"
          />
        </label>
        <label className="admin-form__field">
          <span>Текст відгуку</span>
          <textarea
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Що клієнтка написала про річ чи співпрацю"
          />
        </label>

        <label className="admin-form__field">
          <span>Фото або скріншот переписки (необов'язково)</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageSelected(e.target.files)}
          />
        </label>

        {imagePreview && (
          <div className="admin-form__previews">
            <div className="admin-form__preview">
              <img src={imagePreview} alt="" />
              <button type="button" onClick={removeImage}>
                ×
              </button>
            </div>
          </div>
        )}

        {formError && <p className="admin-form__error">{formError}</p>}
        <div className="admin-form__actions">
          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? "Додаю…" : "Додати відгук"}
          </button>
        </div>
      </form>

      <div className="admin-list admin-reviews__list">
        <h2>Відгуки на сайті ({reviews.length})</h2>
        {error && <p className="admin-page__server-error">{error}</p>}
        {loading && <p className="admin-list__empty">Завантажую…</p>}
        <ul>
          {reviews.map((review) => (
            <li key={review.id} className="admin-list__item admin-reviews__item">
              {review.image && (
                <img className="admin-reviews__thumb" src={review.image} alt="" />
              )}
              <div>
                <strong>{review.name}</strong>
                <span>{review.text}</span>
              </div>
              <div className="admin-list__actions">
                <button
                  type="button"
                  className="admin-list__delete"
                  onClick={() => handleDelete(review.id)}
                >
                  Видалити
                </button>
              </div>
            </li>
          ))}
          {!loading && reviews.length === 0 && (
            <li className="admin-list__empty">Відгуків ще немає.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [isAuthed, setIsAuthed] = useState(
    () => !!window.sessionStorage.getItem(ADMIN_AUTH_KEY)
  );
  const [tab, setTab] = useState<Tab>("products");

  if (!isAuthed) {
    return <LoginGate onSuccess={() => setIsAuthed(true)} />;
  }

  const logout = () => {
    window.sessionStorage.removeItem(ADMIN_AUTH_KEY);
    setIsAuthed(false);
  };

  return (
    <section className="admin-page">
      <div className="container">
        <div className="admin-page__header">
          <div>
            <p className="eyebrow">Адмін-панель</p>
            <h1>Керування сайтом</h1>
            <p className="admin-page__hint">
              Товари й категорії одразу з'являються на сайті для всіх
              відвідувачів. Замовлення наявних речей приходять сюди ж.
            </p>
          </div>
          <button className="btn btn--outline" type="button" onClick={logout}>
            Вийти
          </button>
        </div>

        <div className="admin-page__tabs">
          <button
            type="button"
            className={`admin-page__tab${tab === "products" ? " admin-page__tab--active" : ""}`}
            onClick={() => setTab("products")}
          >
            Товари
          </button>
          <button
            type="button"
            className={`admin-page__tab${tab === "categories" ? " admin-page__tab--active" : ""}`}
            onClick={() => setTab("categories")}
          >
            Категорії
          </button>
          <button
            type="button"
            className={`admin-page__tab${tab === "orders" ? " admin-page__tab--active" : ""}`}
            onClick={() => setTab("orders")}
          >
            Замовлення
          </button>
          <button
            type="button"
            className={`admin-page__tab${tab === "reviews" ? " admin-page__tab--active" : ""}`}
            onClick={() => setTab("reviews")}
          >
            Відгуки
          </button>
        </div>

        {tab === "products" && <ProductsTab />}
        {tab === "categories" && <CategoriesTab />}
        {tab === "orders" && <OrdersTab />}
        {tab === "reviews" && <ReviewsTab />}
      </div>
    </section>
  );
}
