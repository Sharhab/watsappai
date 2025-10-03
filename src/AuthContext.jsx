import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [state, setState] = useState({
    token: localStorage.getItem("token") || null,
    tenantId: localStorage.getItem("tenantId") || null,
  });

  const setToken = (token) => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
    setState((prev) => ({ ...prev, token }));
  };

  const setTenantId = (tenantId) => {
    if (tenantId) {
      localStorage.setItem("tenantId", tenantId);
    } else {
      localStorage.removeItem("tenantId");
    }
    setState((prev) => ({ ...prev, tenantId }));
  };

  return (
    <AuthContext.Provider value={{ ...state, setToken, setTenantId }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
