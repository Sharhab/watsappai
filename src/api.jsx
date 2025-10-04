// src/api.jsx
import { useAuth } from "./AuthContext";

// Pick backend base depending on environment
const BACKEND_BASE =
  import.meta.env.VITE_API_BASE || "https://watsappai2.onrender.com";

// Generic fetch wrapper with tenant + auth headers
export async function tenantFetch(path, options = {}) {
  const token = localStorage.getItem("token");
  const tenantId = localStorage.getItem("tenantId");

  const headers = {
    ...(options.headers || {}),
    Authorization: token ? `Bearer ${token}` : "",
    "x-tenant-id": tenantId || "",
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(
    path.startsWith("http") ? path : `${BACKEND_BASE}${path}`,
    {
      ...options,
      headers,
    }
  );

  // ⚡ Auto logout on 401
  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("tenantId");
    window.location.href = "/login"; // force redirect
    throw new Error("Unauthorized, logged out");
  }

  if (!res.ok) {
    throw new Error(res.statusText || `HTTP ${res.status}`);
  }

  return res;
}

export { BACKEND_BASE };
