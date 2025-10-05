// src/PaymentMethod.jsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BACKEND_BASE } from "./api";
import { useAuth } from "./AuthContext";
import "./App.css";

export default function PaymentMethod() {
  const navigate = useNavigate();
  const params = new URLSearchParams(useLocation().search);
  const plan = params.get("plan");

  const { token } = useAuth();
  const [loadingCard, setLoadingCard] = useState(false);
  const [loadingTransfer, setLoadingTransfer] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [error, setError] = useState("");

  const handlePayment = async (method) => {
    if (!plan) return alert("No plan selected.");
    setError("");

    // Set individual button loading
    if (method === "card") setLoadingCard(true);
    if (method === "transfer") setLoadingTransfer(true);

    try {
      const res = await fetch(`${BACKEND_BASE}/api/payments/initiate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          planId: plan,
          method,
          user: JSON.parse(localStorage.getItem("user")) || {},
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment failed");

      setPaymentInfo(data.result);

      // redirect if card
      if (method === "card" && data.result.checkoutUrl) {
        window.location.href = data.result.checkoutUrl;
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
          {loadingCard ? (
            <span className="spinner"></span>
          ) : (
            "Pay with Monnify"
          )}
        </button>

        <button
          className="btn blue"
          disabled={loadingTransfer}
          onClick={() => handlePayment("transfer")}
        >
          {loadingTransfer ? (
            <span className="spinner"></span>
          ) : (
            "Pay via Bank Transfer"
          )}
        </button>
      </div>

      {error && <p className="status-msg red">⚠️ {error}</p>}

      {/* ✅ Show bank transfer info */}
      {paymentInfo?.accounts && (
        <div className="form-card" style={{ marginTop: "2rem" }}>
          <h3>🏦 Bank Transfer Details</h3>
          {paymentInfo.accounts.map((acc, i) => (
            <div key={i} className="bank-info">
              <p>
                <b>Bank:</b> {acc.bankName}
              </p>
              <p>
                <b>Account Number:</b> {acc.accountNumber}
              </p>
              <p>
                <b>Account Name:</b> {acc.accountName}
              </p>
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
