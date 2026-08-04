export type SwatchKey = "denim" | "shirt" | "scrunchie" | "custom";

export interface Product {
  id: string;
  title: string;
  category: string;
  price: number;
  inStock: boolean;
  description: string;
  details: string;
  fabric: string;
  sizes: string;
  images: string[];
  swatch: SwatchKey;
  accent: string;
  waterLiters: number;
  fabricKg: number;
  co2Kg: number;
  createdAt: string;
}

export type ProductInput = Omit<Product, "id" | "createdAt" | "images"> & {
  existingImages?: string[];
};

export type OrderStatus = "new" | "confirmed" | "done";
export type OrderType = "purchase" | "custom";

export interface OrderItem {
  productId?: string;
  title: string;
  price: number;
}

export interface Order {
  id: string;
  type: OrderType;
  items: OrderItem[];
  name: string;
  phone: string;
  contact: string;
  city: string;
  notes: string;
  status: OrderStatus;
  createdAt: string;
}

// What the client sends to create a "purchase" order (one or more existing
// catalog items — a direct buy or a cart checkout).
export interface PurchaseOrderInput {
  type: "purchase";
  items: { productId: string }[];
  name: string;
  phone: string;
  contact: string;
  city: string;
  notes: string;
}

// What the client sends to create a "custom" made-to-order request (no
// specific catalog item, just a free-form description).
export interface CustomOrderInput {
  type: "custom";
  description: string;
  budget?: number;
  name: string;
  phone: string;
  contact: string;
  city: string;
  notes: string;
}

export type OrderCreateInput = PurchaseOrderInput | CustomOrderInput;

export interface Review {
  id: string;
  name: string;
  text: string;
  image: string;
  createdAt: string;
}

export type ReviewInput = Omit<Review, "id" | "createdAt" | "image">;
