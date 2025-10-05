// src/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [tenantId, setTenantId] = useState(localStorage.getItem("tenantId"));
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );

  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");

    if (tenantId) localStorage.setItem("tenantId", tenantId);
    else localStorage.removeItem("tenantId");

    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [token, tenantId, user]);

  const logout = () => {
    console.log("🔒 Logging out user");
    setToken(null);
    setTenantId(null);
    setUser(null);
    localStorage.clear(); // safe: clears everything
    window.location.href = "/login"; // ✅ redirect cleanly
  };

  return (
    <AuthContext.Provider
      value={{ token, tenantId, user, setToken, setTenantId, setUser, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
