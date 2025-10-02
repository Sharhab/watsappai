import React, { createContext, useContext, useMemo, useState, useEffect } from "react";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [tenantId, setTenantId] = useState(localStorage.getItem("tenantId") || "");

  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  useEffect(() => {
    if (tenantId) localStorage.setItem("tenantId", tenantId);
    else localStorage.removeItem("tenantId");
  }, [tenantId]);

  const value = useMemo(() => ({
    token, tenantId, setToken, setTenantId,
    logout: () => { setToken(""); setTenantId(""); }
  }), [token, tenantId]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}
