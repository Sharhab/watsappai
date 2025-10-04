import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./App.css";

export default function PaymentMethod() {
  const navigate = useNavigate();
  const params = new URLSearchParams(useLocation().search);
  const plan = params.get("plan");

  const handleBankTransfer = () => {
    alert(`Bank transfer instructions for plan: ${plan}`);
    navigate("/business-setup");
  };

  const handleMonnifyPayment = () => {
    alert(`Redirecting to Monnify for plan: ${plan}`);
    // Here you'd integrate Monnify payment link or widget
    navigate("/business-setup");
  };

  return (
    <div className="content-wrapper">
      <h1>💰 Payment Method</h1>
      <p style={{ textAlign: "center" }}>
        Select how you'd like to pay for your <b>{plan?.toUpperCase()}</b> plan.
      </p>

      <div className="payment-methods">
        <button className="btn green" onClick={handleMonnifyPayment}>
          Pay with Monnify
        </button>
        <button className="btn blue" onClick={handleBankTransfer}>
          Pay via Bank Transfer
        </button>
      </div>
    </div>
  );
}
