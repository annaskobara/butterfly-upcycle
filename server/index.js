import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { mkdirSync } from "node:fs";
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  setProductStock,
  listCategories,
  addCategory,
  deleteCategory,
  listOrders,
  createOrder,
  updateOrder,
  deleteOrder,
  listReviews,
  createReview,
  deleteReview,
} from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, "uploads");
mkdirSync(UPLOADS_DIR, { recursive: true });

const PORT = process.env.PORT || 4000;
// Change this before deploying anywhere public.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "butterfly2026";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(UPLOADS_DIR));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${ext}`);
  },
});

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024, files: 8 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_TYPES.has(file.mimetype)) {
      cb(new Error("Непідтримуваний формат зображення"));
      return;
    }
    cb(null, true);
  },
});

function requireAdmin(req, res, next) {
  const password = req.header("x-admin-password");
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Невірний пароль адміністратора" });
  }
  next();
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function parseProductFields(body) {
  return {
    title: String(body.title || "").trim(),
    category: String(body.category || "").trim(),
    price: toNumber(body.price, 0),
    inStock: body.inStock === "true" || body.inStock === true,
    description: String(body.description || "").trim(),
    details: String(body.details || "").trim(),
    fabric: String(body.fabric || "").trim(),
    sizes: String(body.sizes || "").trim(),
    swatch: String(body.swatch || "custom"),
    accent: String(body.accent || "#6d1f2e"),
    waterLiters: toNumber(body.waterLiters, 0),
    fabricKg: toNumber(body.fabricKg, 0),
    co2Kg: toNumber(body.co2Kg, 0),
  };
}

// --- Products ---

app.get("/api/products", async (_req, res) => {
  res.json(await listProducts());
});

app.post("/api/admin/verify", requireAdmin, (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/products/:id", async (req, res) => {
  const product = await getProduct(req.params.id);
  if (!product) return res.status(404).json({ error: "Товар не знайдено" });
  res.json(product);
});

app.post(
  "/api/products",
  requireAdmin,
  upload.array("images", 8),
  async (req, res, next) => {
    try {
      const fields = parseProductFields(req.body);
      if (!fields.title || fields.price <= 0) {
        return res.status(400).json({ error: "Вкажіть назву і ціну товару" });
      }
      const uploadedUrls = (req.files || []).map((f) => `/uploads/${f.filename}`);

      const product = {
        id: `${fields.title.toLowerCase().replace(/[^a-zа-яїєіґ0-9]+/gi, "-").replace(/(^-|-$)/g, "") || "product"}-${Date.now().toString(36)}`,
        ...fields,
        images: uploadedUrls,
        createdAt: new Date().toISOString(),
      };

      await createProduct(product);
      res.status(201).json(product);
    } catch (err) {
      next(err);
    }
  }
);

app.put(
  "/api/products/:id",
  requireAdmin,
  upload.array("images", 8),
  async (req, res, next) => {
    try {
      const existing = await getProduct(req.params.id);
      if (!existing) return res.status(404).json({ error: "Товар не знайдено" });

      const fields = parseProductFields(req.body);
      if (!fields.title || fields.price <= 0) {
        return res.status(400).json({ error: "Вкажіть назву і ціну товару" });
      }

      // existingImages carries the admin's chosen order for images that were
      // already on the product; newly uploaded files are appended after them
      // in the order they were selected.
      let keptImages = [];
      try {
        keptImages = JSON.parse(req.body.existingImages || "[]");
        if (!Array.isArray(keptImages)) keptImages = [];
      } catch {
        keptImages = [];
      }
      const uploadedUrls = (req.files || []).map((f) => `/uploads/${f.filename}`);

      const updated = await updateProduct(req.params.id, {
        ...fields,
        images: [...keptImages, ...uploadedUrls],
      });

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

app.delete("/api/products/:id", requireAdmin, async (req, res) => {
  const ok = await deleteProduct(req.params.id);
  if (!ok) return res.status(404).json({ error: "Товар не знайдено" });
  res.status(204).end();
});

// --- Categories ---

app.get("/api/categories", async (_req, res) => {
  res.json(await listCategories());
});

app.post("/api/categories", requireAdmin, async (req, res) => {
  const name = String(req.body?.name || "").trim();
  if (!name) return res.status(400).json({ error: "Вкажіть назву категорії" });
  const categories = await addCategory(name);
  res.status(201).json(categories);
});

app.delete("/api/categories/:name", requireAdmin, async (req, res) => {
  const categories = await deleteCategory(decodeURIComponent(req.params.name));
  res.json(categories);
});

// --- Orders ---
// Placing an order is public (any visitor with the link can submit it) —
// only *reading*, updating status, or deleting orders requires the admin
// password, so customer contact details stay private.
//
// Two kinds of orders share the same collection:
//  - "purchase": one or more existing catalog items (single "buy this now" or
//    a cart with several items). Each item must reference a real productId;
//    those products get auto-marked out of stock once the order lands.
//  - "custom": a made-to-order request with no specific catalog item — just
//    a free-form description of what the person wants.

app.post("/api/orders", async (req, res, next) => {
  try {
    const body = req.body || {};
    const type = body.type === "custom" ? "custom" : "purchase";
    const name = String(body.name || "").trim();
    const contact = String(body.contact || "").trim();

    if (!name || !contact) {
      return res.status(400).json({ error: "Вкажіть ім'я і контакт для зв'язку" });
    }

    let items = [];

    if (type === "purchase") {
      const rawItems = Array.isArray(body.items) ? body.items : [];
      for (const raw of rawItems) {
        const productId = String(raw?.productId || "").trim();
        if (!productId) continue;
        const product = await getProduct(productId);
        if (!product) continue;
        items.push({ productId: product.id, title: product.title, price: product.price });
      }
      if (items.length === 0) {
        return res.status(400).json({ error: "Кошик порожній або товари не знайдено" });
      }
    } else {
      const description = String(body.description || "").trim();
      if (!description) {
        return res.status(400).json({ error: "Опишіть, яку річ ви хочете замовити" });
      }
      items = [{ title: description, price: toNumber(body.budget, 0) }];
    }

    const order = {
      id: randomUUID(),
      type,
      items,
      name,
      phone: String(body.phone || "").trim(),
      contact,
      city: String(body.city || "").trim(),
      notes: String(body.notes || "").trim(),
      status: "new",
      createdAt: new Date().toISOString(),
    };

    await createOrder(order);

    if (type === "purchase") {
      // Ready-made pieces just got claimed — mark them sold automatically.
      // The admin can flip any of them back to "in stock" later if an order
      // falls through.
      for (const item of items) {
        if (item.productId) await setProductStock(item.productId, false);
      }
    }

    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});

app.get("/api/orders", requireAdmin, async (_req, res) => {
  res.json(await listOrders());
});

app.patch("/api/orders/:id", requireAdmin, async (req, res) => {
  const allowedStatuses = new Set(["new", "confirmed", "done"]);
  const status = req.body?.status;
  if (!allowedStatuses.has(status)) {
    return res.status(400).json({ error: "Невірний статус замовлення" });
  }
  const updated = await updateOrder(req.params.id, { status });
  if (!updated) return res.status(404).json({ error: "Замовлення не знайдено" });
  res.json(updated);
});

app.delete("/api/orders/:id", requireAdmin, async (req, res) => {
  const ok = await deleteOrder(req.params.id);
  if (!ok) return res.status(404).json({ error: "Замовлення не знайдено" });
  res.status(204).end();
});

// --- Reviews ---
// Publicly readable testimonials; only the admin can add or remove them.

app.get("/api/reviews", async (_req, res) => {
  res.json(await listReviews());
});

app.post("/api/reviews", requireAdmin, upload.single("image"), async (req, res, next) => {
  try {
    const name = String(req.body?.name || "").trim();
    const text = String(req.body?.text || "").trim();
    if (!name || !text) {
      return res.status(400).json({ error: "Вкажіть ім'я і текст відгуку" });
    }
    const review = {
      id: randomUUID(),
      name,
      text,
      image: req.file ? `/uploads/${req.file.filename}` : "",
      createdAt: new Date().toISOString(),
    };
    await createReview(review);
    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
});

app.delete("/api/reviews/:id", requireAdmin, async (req, res) => {
  const ok = await deleteReview(req.params.id);
  if (!ok) return res.status(404).json({ error: "Відгук не знайдено" });
  res.status(204).end();
});

// Multer / generic error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(400).json({ error: err.message || "Помилка сервера" });
});

app.listen(PORT, () => {
  console.log(`butterfly upcycle API running on http://localhost:${PORT}`);
});
