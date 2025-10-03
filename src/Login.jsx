import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const { setToken, setTenantId } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    try {
      const res = await fetch("https://watsappai2.onrender.com/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, phone }),
      });

      const data = await res.json();
      if (data.success) {
        console.log("✅ Login successful:", data);

        // Save into localStorage + context
        localStorage.setItem("token", data.token);
        localStorage.setItem("tenantId", data.tenant);

        setToken(data.token);
        setTenantId(data.tenant);

        setMsg("✅ Login successful! Redirecting...");
        setTimeout(() => navigate("/"), 1000);
      } else {
        console.error("❌ Login failed:", data.error);
        setMsg(data.error || "Login failed");
      }
    } catch (err) {
      console.error("❌ Login error:", err);
      setMsg("Something went wrong, please try again.");
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-card">
        <h2>🔑 Login</h2>

        <input
          type="email"
          placeholder="Owner Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Owner Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">Login</button>
        {msg && <p className="status-msg">{msg}</p>}
      </form>
    </div>
  );
}
