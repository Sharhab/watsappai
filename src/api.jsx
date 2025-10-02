// src/api.jsx
export const BACKEND_BASE = "https://watsappai2.onrender.com";

/**
 * tenantFetch ensures each request includes tenant + auth headers
 */
export async function tenantFetch(url, options = {}) {
  const token = localStorage.getItem("token");
  const tenantId = localStorage.getItem("tenantId");

  const headers = {
    ...(options.headers || {}),
    Authorization: token ? `Bearer ${token}` : "",
    "x-tenant-id": tenantId || "",
  };

  return fetch(url, { ...options, headers });
}
