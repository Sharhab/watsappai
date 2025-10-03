// src/pages/Register.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext"; // ✅ hook for auth state
import "./App.css";

export default function Register() {
  const [form, setForm] = useState({
    businessName: "",
    ownerEmail: "",
    ownerPhone: "",
    whatsappNumber: "",
    twilioAccountSid: "",
    twilioAuthToken: "",
    templateSid: "",
    statusCallbackUrl: "",
    plan: "free",
    password: "",
  });
  const [msg, setMsg] = useState("");

  const { setToken, setTenantId } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    try {
      const res = await fetch("https://watsappai2.onrender.com/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      console.log("✅ Registered:", data);

      if (data.success) {
        // Save into context + localStorage
        setToken(data.token);
        setTenantId(data.tenant);
        localStorage.setItem("token", data.token);
        localStorage.setItem("tenantId", data.tenant);

        setMsg("✅ Registration successful! Redirecting...");
        setTimeout(() => navigate("/"), 1000);
      } else {
        setMsg(data.error || "Registration failed");
      }
    } catch (err) {
      console.error("❌ Register failed:", err);
      setMsg("Something went wrong, please try again.");
    }
  };

  return (
    <div className="register-container">
      <form onSubmit={handleSubmit} className="register-form">
        <h2>Create Your Business Account</h2>

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
          placeholder="Owner Email"
          value={form.ownerEmail}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="ownerPhone"
          placeholder="Owner Phone"
          value={form.ownerPhone}
          onChange={handleChange}
        />
        <input
          type="text"
          name="whatsappNumber"
          placeholder="WhatsApp Number"
          value={form.whatsappNumber}
          onChange={handleChange}
        />
        <input
          type="text"
          name="twilioAccountSid"
          placeholder="Twilio Account SID"
          value={form.twilioAccountSid}
          onChange={handleChange}
        />
        <input
          type="text"
          name="twilioAuthToken"
          placeholder="Twilio Auth Token"
          value={form.twilioAuthToken}
          onChange={handleChange}
        />
        <input
          type="text"
          name="templateSid"
          placeholder="Template SID"
          value={form.templateSid}
          onChange={handleChange}
        />
        <input
          type="text"
          name="statusCallbackUrl"
          placeholder="Status Callback URL"
          value={form.statusCallbackUrl}
          onChange={handleChange}
        />

        <input
          type="password"
          name="password"
          placeholder="Set Password"
          value={form.password}
          onChange={handleChange}
          required
        />

        <button type="submit">🚀 Register</button>
        {msg && <p className="status-msg">{msg}</p>}
      </form>
    </div>
  );
}
