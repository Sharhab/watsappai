// Pick backend base depending on environment
const BACKEND_BASE =
  import.meta.env.VITE_API_BASE ||
  (window.location.hostname.includes("onrender.com")
    ? "https://watsappai2.onrender.com"
    : "http://localhost:3000");

// Generic fetch wrapper with tenant + auth headers
export async function tenantFetch(path, options = {}) {
  const token = localStorage.getItem("token");
  const tenantId = localStorage.getItem("tenantId"); // must be saved at login

  const headers = {
    ...(options.headers || {}),
    "x-tenant-id": tenantId || "",
  };

  // ✅ Only add Authorization if token exists
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // ⚠️ Important: do not force JSON if sending FormData
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

  if (!res.ok) {
    throw new Error(res.statusText || `HTTP ${res.status}`);
  }
  return res;
}

export { BACKEND_BASE };
