import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import { BACKEND_BASE } from "./api";
import { useNavigate } from "react-router-dom";
import "./App.css";

export default function TwilioSetup() {
  const { token, tenantId } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    whatsappNumber: "",
    twilioAccountSid: "",
    twilioAuthToken: "",
    templateSid: "",
    statusCallbackUrl: "",
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_BASE}/api/auth/update-twilio`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-tenant-id": tenantId,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (data.success) {
        setMsg("✅ Twilio configuration saved successfully!");
        setTimeout(() => navigate("/dashboard"), 1000);
      } else {
        setMsg(data.error || "Failed to update Twilio configuration");
      }
    } catch (err) {
      console.error("❌ Update failed:", err);
      setMsg("Something went wrong, please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-wrapper">
      <h1>⚙️ Twilio & WhatsApp Setup</h1>
      <p style={{ textAlign: "center" }}>
        Please enter your Twilio credentials to activate your AI WhatsApp Agent.
      </p>

      <form onSubmit={handleSubmit} className="form-card">
        <input
          type="text"
          name="whatsappNumber"
          placeholder="WhatsApp Business Number (e.g., +234...)"
          value={form.whatsappNumber}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="twilioAccountSid"
          placeholder="Twilio Account SID"
          value={form.twilioAccountSid}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="twilioAuthToken"
          placeholder="Twilio Auth Token"
          value={form.twilioAuthToken}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="templateSid"
          placeholder="Template SID (optional)"
          value={form.templateSid}
          onChange={handleChange}
        />

        <input
          type="text"
          name="statusCallbackUrl"
          placeholder="Status Callback URL (optional)"
          value={form.statusCallbackUrl}
          onChange={handleChange}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Configuration"}
        </button>
        {msg && <p className="status-msg">{msg}</p>}
      </form>
    </div>
  );
}
