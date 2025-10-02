const isProduction = import.meta.env.PROD; // Vite, or use process.env.NODE_ENV if CRA

export const BACKEND_BASE = isProduction
  ? "https://watsappai2.onrender.com"
  : "http://localhost:3000";

export const API = {
  tenants: `${BACKEND_BASE}/api/tenants`,
  auth: `${BACKEND_BASE}`,
  qas: `${BACKEND_BASE}/api/qas`,
  intro: `${BACKEND_BASE}/api/intro`,
  orders: `${BACKEND_BASE}/api/orders`,
};
