import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children }) {
  const { token, tenantId } = useAuth();
  if (!token || !tenantId) return <Navigate to="/login" replace />;
  return children;
}
