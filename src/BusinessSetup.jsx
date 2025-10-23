// src/BusinessSetup.jsx
import React, { useState, useEffect } from "react";
import { BACKEND_BASE } from "./api";
import { useNavigate, useLocation } from "react-router-dom";

export default function BusinessSetup() {
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    businessName: "",
    whatsappNumber: "",
    category: "",
  });

  const [status, setStatus] = useState("");
  const [verifiedPayment, setVerifiedPayment] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  /**
   * ✅ Handle Paystack redirect verification
   * Runs automatically if user was redirected with ?reference=xxxx
   */
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const reference = params.get("reference");

    if (!reference) return; // no payment reference present

    async function verifyPayment() {
      try {
        setLoading(true);
        setStatus("🔍 Verifying payment, please wait...");

        const res = await fetch(`${BACKEND_BASE}/api/payments/verify/${reference}`);
        const data = await res.json();

        if (data.success && data.status === "success") {
          setVerifiedPayment(true);
          setStatus("✅ Payment verified successfully! Activating your account...");
          console.log("✅ Payment verified:", data);

          // Wait a bit for visual feedback, then go to next step
          setTimeout(() => {
            setStatus("");
          }, 3000);
        } else {
          setStatus("⚠️ Payment verification failed or not completed.");
        }
      } catch (err) {
        console.error("❌ Verification error:", err);
        setStatus("❌ Error verifying payment. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    verifyPayment();
  }, [location.search]);

  /**
   * ✅ Handle business setup form
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return; // prevent submit while verifying

    const res = await fetch(`${BACKEND_BASE}/api/tenants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      alert("🎉 Business setup complete!");
      navigate("/qa");
    } else {
      alert("⚠️ Setup failed. Please try again.");
    }
  };

  return (
    <div className="content-wrapper">
      <h1>Business Setup</h1>

      {/* ✅ Show payment verification status */}
      {status && (
        <p
          style={{
            textAlign: "center",
            marginBottom: 15,
            color: status.includes("✅") ? "green" : "#d9534f",
          }}
        >
          {status}
        </p>
      )}

      <form onSubmit={handleSubmit} className="form-card">
        <input
          name="businessName"
          placeholder="Business Name"
          onChange={handleChange}
          required
        />
        <input
          name="whatsappNumber"
          placeholder="WhatsApp Number"
          onChange={handleChange}
          required
        />
        <input
          name="category"
          placeholder="Business Category"
          onChange={handleChange}
          required
        />
        <button className="btn green" type="submit" disabled={loading}>
          {loading ? "Processing..." : verifiedPayment ? "Continue" : "Save & Continue"}
        </button>
      </form>
    </div>
  );
}
