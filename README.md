# 🦋 butterfly upcycle

A modern full-stack web application and online store built for the designer upcycled clothing brand "butterfly upcycle" (Dnipro, Ukraine). This project demonstrates modern UI layout, custom React components, dynamic backend integrations, and persistent state management.

## 🔗 Live Demo
* **Frontend (Vercel):** https://butterfly-upcycle.vercel.app
* **Backend API (Render):** https://butterfly-upcycle-api.onrender.com

## 📝 Description
This is a full-stack Single Page Application (SPA) designed to showcase upcycled fashion items, manage customer requests, and process custom orders. The platform features dynamic data fetching where products, categories, customer reviews, and incoming orders are synced with the backend server and updated in real time for all visitors.

## 🛠 Technologies
* **Frontend:** React 18, TypeScript, SCSS (BEM methodology, modular architecture), React Router DOM (v6).
* **Backend:** Node.js, Express, Multer (file & image upload handling), JSON-based file storage (`db.json`).
* **Deployment & Tooling:** Vite, Vercel (SPA routing), Render (Node.js Web Service), Git.

## 🎯 Key Features
* **Dynamic Product Catalog & Filtering:** Fluid category selection, in-stock status toggle, and detailed product cards with ecological impact stats (water saved, fabric salvaged, CO₂ reduced).
* **Interactive Shopping Cart:** Persistent cart state using `localStorage` with Nova Poshta delivery checkout integration.
* **Custom Order System:** Dedicated workflow (`/custom-order`) allowing clients to request unique upcycled pieces or order variations of sold-out items.
* **Secured Admin Panel:** Password-protected dashboard (`/admin`) for full CRUD management:
  * **Products:** Add, edit, remove, reorder item gallery photos, and configure eco-metrics.
  * **Categories:** Manage product categories dynamically.
  * **Orders:** Track purchases and custom requests with real-time status updates (*New*, *Confirmed*, *Done*).
  * **Reviews:** Moderate and publish customer feedback with optional screenshot attachments.
* **SPA Routing & Production Ready:** Optimized routing fallback (`vercel.json`) to support direct page reloads across all routes without 404 errors.

## ▶️ How to run locally

### 1. Backend setup
* **Navigate into the server folder:** `cd server`
* **Install dependencies:** `npm install`
* **Start the server:** `npm start` *(runs on http://localhost:4000)*

### 2. Frontend setup
* **Open a second terminal in the root directory:** `npm install`
* **Run the development server:** `npm run dev` *(runs on http://localhost:5173)*

## 🔐 Environment Variables
To customize backend options locally or in deployment, create a `.env` file inside the `server/` directory:
```env
PORT=4000
ADMIN_PASSWORD=your_custom_admin_password