// src/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [tenantId, setTenantId] = useState(localStorage.getItem("tenantId"));

  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");

    if (tenantId) localStorage.setItem("tenantId", tenantId);
    else localStorage.removeItem("tenantId");
  }, [token, tenantId]);

const logout = () => {
  setToken(null);
  setTenantId(null);
  localStorage.removeItem("token");
  localStorage.removeItem("tenantId");
  window.location.href = "/login"; // also force redirect
};

  return (
    <AuthContext.Provider value={{ token, tenantId, setToken, setTenantId, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
