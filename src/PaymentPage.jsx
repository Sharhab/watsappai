import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import "./App.css";

export default function PaymentPage() {
  const { tenantId } = useAuth();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);

  const plans = [
    {
      id: "basic",
      name: "Basic Plan",
      price: "₦30,000",
      duration: "1 Month",
      features: [
        "AI WhatsApp Chat Assistant",
        "Hausa, English & French Support",
        "Basic Q&A Automation",
        "Voice-to-Text & Reply System",
      ],
    },
    {
      id: "medium",
      name: "Medium Plan",
      price: "₦80,000",
      duration: "3 Months",
      features: [
        "Everything in Basic",
        "Custom Business Profile",
        "Extended Conversation Memory",
        "Faster Support Response",
      ],
    },
    {
      id: "pro",
      name: "Pro Plan",
      price: "₦240,000",
      duration: "1 Year",
      features: [
        "Everything in Medium",
        "Advanced Analytics Dashboard",
        "Full Conversation Logs",
        "Priority Setup & Integration",
      ],
    },
  ];

  const handleSelectPlan = (plan) => setSelectedPlan(plan);

  const handleProceedPayment = () => {
    if (!selectedPlan) {
      alert("Please select a plan to continue.");
      return;
    }

    // ✅ Correct way → send plan using router state
    navigate("/payment-method", { state: { plan: selectedPlan.id } });
  };

  return (
    <div className="content-wrapper">

      <h1>GLOBSTAND TECHNOLOGIES</h1>
      <h2>💳 Choose Your Plan</h2>
      <p style={{ textAlign: "center" }}>
        Choose the plan that fits your business needs and start using your WhatsApp AI Agent.
      </p>

      <div className="plans-container">
        {plans.map((p) => (
          <div
            key={p.id}
            className={`plan-card ${selectedPlan?.id === p.id ? "selected" : ""}`}
            onClick={() => handleSelectPlan(p)}
          >
            <h2>{p.name}</h2>
            <h3>{p.duration}</h3>
            <p><b>{p.price}</b></p>
            <ul>
              {p.features.map((f, idx) => (
                <li key={idx}>{f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", marginTop: 20 }}>
        <button className="btn green" onClick={handleProceedPayment}>
          Proceed to Payment
        </button>
      </div>
    </div>
  );
}
