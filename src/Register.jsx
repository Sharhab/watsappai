import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import "./App.css";

export default function Register() {
  const [form, setForm] = useState({
    businessName: "",
    ownerEmail: "",
    ownerPhone: "",
    password: "",
    plan: "basic", // default to basic for now
  });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const { setToken, setTenantId } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      const res = await fetch("https://watsappai2.onrender.com/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      console.log("✅ Registered:", data);

      if (data.success) {
        // Save auth info
        localStorage.setItem("token", data.token);
        localStorage.setItem("tenantId", data.tenant);
        setToken(data.token);
        setTenantId(data.tenant);

        setMsg("✅ Registration successful! Redirecting to payment...");
        setTimeout(() => navigate(`/payment?plan=${form.plan}`), 1200);
      } else {
        setMsg(data.error || "Registration failed");
      }
    } catch (err) {
      console.error("❌ Register failed:", err);
      setMsg("Something went wrong, please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <form onSubmit={handleSubmit} className="register-form">
        <h2>🧾 Create Your Business Account</h2>
        <p style={{ fontSize: "0.9rem", color: "#555" }}>
          Register your business to start using your personalized WhatsApp AI Agent.
        </p>

        <input
          type="text"
          name="businessName"
          placeholder="Business Name"
          value={form.businessName}
          onChange={handleChange}
          required
        />

        <input
          type="email"
          name="ownerEmail"
          placeholder="Business Email"
          value={form.ownerEmail}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="ownerPhone"
          placeholder="Business Phone Number"
          value={form.ownerPhone}
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Set Password"
          value={form.password}
          onChange={handleChange}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Processing..." : "🚀 Register"}
        </button>

        {msg && <p className="status-msg">{msg}</p>}
      </form>
    </div>
  );
}
