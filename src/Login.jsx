// src/Login.jsx
import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import "./App.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(""); // Kept for UI (not used in request)
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const { setToken, setTenantId } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      const res = await fetch("https://watsappai2.onrender.com/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ✅ Only send needed fields
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success) {
        console.log("✅ Login successful:", data);

        // ✅ Save session
        localStorage.setItem("token", data.token);
        localStorage.setItem("tenant", data.tenant);
        localStorage.setItem("email", data.email);

        setToken(data.token);
        setTenantId(data.tenant);

        setMsg("✅ Login successful! Redirecting...");
        setTimeout(() => navigate("/dashboard"), 800);
      } else {
        setMsg(data.error || "Invalid email or password.");
      }
    } catch (err) {
      console.error("❌ Login error:", err);
      setMsg("Network error. Check your internet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-card">
        <h1>GLOBSTAND TECHNOLOGIES</h1>
        <h2>🔑 Login</h2>

        <input
          type="email"
          placeholder="Owner Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
        />

        {/* ✅ Phone field remains visible, but not required for login */}
        <input
          type="text"
          placeholder="Owner Phone (optional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={loading}
        />

        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          required
        />

        <button type="submit" className="btn green" disabled={loading}>
          {loading ? <span className="spinner"></span> : "Login"}
        </button>

        {msg && <p className="status-msg">{msg}</p>}
      </form>
    </div>
  );
}
