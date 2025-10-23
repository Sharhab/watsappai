// src/PaymentMethod.jsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BACKEND_BASE } from "./api";
import { useAuth } from "./AuthContext";
import jwtDecode from "jwt-decode"; // ✅ corrected import (default export)
import "./App.css";

export default function PaymentMethod() {
  const navigate = useNavigate();
  const params = new URLSearchParams(useLocation().search);
  const plan = params.get("plan");

  const { token, user } = useAuth();
  const [loadingCard, setLoadingCard] = useState(false);
  const [loadingTransfer, setLoadingTransfer] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [error, setError] = useState("");

  const handlePayment = async (method) => {
    if (!plan) return alert("No plan selected.");
    setError("");

    if (method === "card") setLoadingCard(true);
    if (method === "transfer") setLoadingTransfer(true);

    try {
      // ✅ Ensure we have a valid user with email
      let currentUser = user || JSON.parse(localStorage.getItem("user")) || {};
      let decoded = {};

      if (token) {
        try {
          decoded = jwtDecode(token);
        } catch (e) {
          console.warn("⚠️ Failed to decode token:", e.message);
        }
      }

      currentUser.email = currentUser.email || decoded.email || "";
      currentUser.id = currentUser.id || decoded.id || "";

      if (!currentUser.email) {
        throw new Error("Missing user email — please re-login.");
      }

      console.log("🧾 Initiating Paystack payment for:", currentUser.email);

      const res = await fetch(`${BACKEND_BASE}/api/payments/initiate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          planId: plan,
          method,
          user: currentUser,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment failed");

      setPaymentInfo(data.result);

      // ✅ Redirect to Paystack Checkout
      if (method === "card" && data.result.checkoutUrl) {
        console.log("🌐 Redirecting to Paystack Checkout...");
        window.location.href = data.result.checkoutUrl;
      }

      // ✅ Show account info if transfer
      if (method === "transfer" && data.result.accounts) {
        console.log("🏦 Paystack dedicated account generated");
      }
    } catch (err) {
      console.error("❌ Payment error:", err);
      setError(err.message);
    } finally {
      setLoadingCard(false);
      setLoadingTransfer(false);
    }
  };

  return (
    <div className="content-wrapper">
      <h1>💰 Payment Method</h1>
      <p style={{ textAlign: "center" }}>
        Choose how you'd like to pay for your <b>{plan?.toUpperCase()}</b> plan.
      </p>

      <div className="payment-methods">
        <button
          className="btn green"
          disabled={loadingCard}
          onClick={() => handlePayment("card")}
        >
          {loadingCard ? <span className="spinner"></span> : "Pay with Paystack"}
        </button>

        <button
          className="btn blue"
          disabled={loadingTransfer}
          onClick={() => handlePayment("transfer")}
        >
          {loadingTransfer ? <span className="spinner"></span> : "Pay via Bank Transfer"}
        </button>
      </div>

      {error && <p className="status-msg red">⚠️ {error}</p>}

      {/* ✅ Show bank transfer info */}
      {paymentInfo?.accounts && (
        <div className="form-card" style={{ marginTop: "2rem" }}>
          <h3>🏦 Bank Transfer Details</h3>
          {paymentInfo.accounts.map((acc, i) => (
            <div key={i} className="bank-info">
              <p><b>Bank:</b> {acc.bankName}</p>
              <p><b>Account Number:</b> {acc.accountNumber}</p>
              <p><b>Account Name:</b> {acc.accountName}</p>
            </div>
          ))}
          <button
            className="btn green"
            style={{ marginTop: 10 }}
            onClick={() => navigate("/business-setup")}
          >
            I've Made Payment
          </button>
        </div>
      )}
    </div>
  );
}
