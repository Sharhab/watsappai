import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import "./App.css"; // make sure spinner style is included

export default function Login() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
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
        body: JSON.stringify({ email, password, phone }),
      });

      const data = await res.json();

      if (data.success) {
        console.log("✅ Login successful:", data);
        localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user || {}));
      localStorage.setItem("email", data.email);

        setToken(data.token);
        setTenantId(data.tenant);

        setMsg("✅ Login successful! Redirecting...");
        setTimeout(() => navigate("/payment"), 1000);
      } else {
        console.error("❌ Login failed:", data.error);
        setMsg(data.error || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      console.error("❌ Login error:", err);
      setMsg("Something went wrong, please try again.");
    } finally {
      setLoading(false);
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
          disabled={loading}
          required
        />

        <input
          type="text"
          placeholder="Owner Phone"
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
