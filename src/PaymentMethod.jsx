// src/PaymentMethod.jsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { BACKEND_BASE } from "./api";
import { jwtDecode } from "jwt-decode";
import "./App.css";

export default function PaymentMethod() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useAuth();

  const plan = location.state?.plan || null;

  const [error, setError] = useState("");
  const [loadingCard, setLoadingCard] = useState(false);
  const [loadingTransfer, setLoadingTransfer] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [showTransfer, setShowTransfer] = useState(false);

  const handlePayment = async (method) => {
    if (!plan) {
      alert("Please select a plan first.");
      return navigate("/payment");
    }

    setError("");
    if (method === "card") setLoadingCard(true);
    if (method === "transfer") setLoadingTransfer(true);

    try {
      let currentUser = user || JSON.parse(localStorage.getItem("user")) || {};
      let decoded = {};

      if (token) {
        try { decoded = jwtDecode(token); } catch {}
      }

      currentUser.email = currentUser.email || decoded.email || "";
      currentUser.id = currentUser.id || decoded.id || "";

      if (!currentUser.email) {
        localStorage.clear();
        return navigate("/login");
      }

      const res = await fetch(`${BACKEND_BASE}/api/payments/initiate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ planId: plan, method, user: currentUser }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment failed");

      setPaymentInfo(data.result);

      // ✅ Redirect to Paystack if using card
      if (method === "card" && data.result.checkoutUrl) {
        window.location.href = data.result.checkoutUrl;
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingCard(false);
      setLoadingTransfer(false);
    }
  };

  return (
    <div className="payment-method-page">

      <h2>💰 Payment Method</h2>
      <p><b>Selected Plan:</b> {plan}</p>

      {error && <div className="error-box">{error}</div>}

      {/* ✅ Recommended Main Button */}
      <button
        className="btn green"
        onClick={() => handlePayment("card")}
        disabled={loadingCard}
      >
        {loadingCard ? "Processing..." : "💳 Pay Now"}
      </button>

      {/* Small link to reveal transfer */}
      {/* <p style={{ marginTop: 12 }}>
        <button
          className="btn link-btn"
          onClick={() => setShowTransfer(!showTransfer)}
        >
          {showTransfer ? "Hide Bank Transfer" : "Prefer Bank Transfer?"}
        </button>
      </p> */}

      {/* Bank Transfer Section (hidden until clicked) */}
      {showTransfer && (
        <div>

          {paymentInfo && paymentInfo.method === "transfer" && (
            <div className="transfer-box">
              <h3>Bank Transfer Details</h3>
              <p><b>Bank:</b> {paymentInfo.bankName}</p>
              <p><b>Account Name:</b> {paymentInfo.accountName}</p>
              <p><b>Account Number:</b> {paymentInfo.accountNumber}</p>
              <p><b>Amount:</b> ₦{paymentInfo.amount}</p>
            </div>
          )}
        </div>
      )}

      <button className="btn gray" onClick={() => navigate(-1)}>
        ⬅ Back
      </button>

    </div>
  );
}
