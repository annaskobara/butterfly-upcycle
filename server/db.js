import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { seedProducts, seedCategories, seedReviews } from "./seedProducts.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.join(__dirname, "db.json");

function defaultData() {
  return {
    products: seedProducts,
    categories: seedCategories,
    orders: [],
    reviews: seedReviews,
  };
}

async function readAll() {
  if (!existsSync(DB_FILE)) {
    const initial = defaultData();
    await writeFile(DB_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  const raw = await readFile(DB_FILE, "utf-8");
  try {
    const data = JSON.parse(raw);
    // Migrate older db.json files that predate categories/orders/reviews.
    if (!Array.isArray(data.products)) data.products = seedProducts;
    if (!Array.isArray(data.categories)) data.categories = seedCategories;
    if (!Array.isArray(data.orders)) data.orders = [];
    if (!Array.isArray(data.reviews)) data.reviews = seedReviews;
    return data;
  } catch {
    return defaultData();
  }
}

async function writeAll(data) {
  await writeFile(DB_FILE, JSON.stringify(data, null, 2));
}

// --- Products ---

export async function listProducts() {
  const { products } = await readAll();
  return [...products].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function getProduct(id) {
  const { products } = await readAll();
  return products.find((p) => p.id === id);
}

export async function createProduct(product) {
  const data = await readAll();
  data.products.unshift(product);
  await writeAll(data);
  return product;
}

export async function updateProduct(id, patch) {
  const data = await readAll();
  const idx = data.products.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  data.products[idx] = { ...data.products[idx], ...patch };
  await writeAll(data);
  return data.products[idx];
}

export async function setProductStock(id, inStock) {
  return updateProduct(id, { inStock });
}

export async function deleteProduct(id) {
  const data = await readAll();
  const before = data.products.length;
  data.products = data.products.filter((p) => p.id !== id);
  await writeAll(data);
  return data.products.length < before;
}

// --- Categories ---

export async function listCategories() {
  const { categories } = await readAll();
  return categories;
}

export async function addCategory(name) {
  const data = await readAll();
  if (!data.categories.includes(name)) {
    data.categories.push(name);
    await writeAll(data);
  }
  return data.categories;
}

export async function deleteCategory(name) {
  const data = await readAll();
  data.categories = data.categories.filter((c) => c !== name);
  await writeAll(data);
  return data.categories;
}

// --- Orders ---

export async function listOrders() {
  const { orders } = await readAll();
  return [...orders].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function createOrder(order) {
  const data = await readAll();
  data.orders.unshift(order);
  await writeAll(data);
  return order;
}

export async function updateOrder(id, patch) {
  const data = await readAll();
  const idx = data.orders.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  data.orders[idx] = { ...data.orders[idx], ...patch };
  await writeAll(data);
  return data.orders[idx];
}

export async function deleteOrder(id) {
  const data = await readAll();
  const before = data.orders.length;
  data.orders = data.orders.filter((o) => o.id !== id);
  await writeAll(data);
  return data.orders.length < before;
}

// --- Reviews ---

export async function listReviews() {
  const { reviews } = await readAll();
  return [...reviews].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function createReview(review) {
  const data = await readAll();
  data.reviews.unshift(review);
  await writeAll(data);
  return review;
}

export async function deleteReview(id) {
  const data = await readAll();
  const before = data.reviews.length;
  data.reviews = data.reviews.filter((r) => r.id !== id);
  await writeAll(data);
  return data.reviews.length < before;
}
