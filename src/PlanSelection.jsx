import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    name: "Basic",
    duration: "1 Month",
    price: 5000,
    features: [
      "AI WhatsApp Agent Setup",
      "Voice & Text Reply",
      "Session Tracking",
      "1 Admin Account"
    ]
  },
  {
    name: "Medium",
    duration: "3 Months",
    price: 13000,
    features: [
      "AI WhatsApp Agent Setup",
      "Voice & Text Reply",
      "Session Tracking",
      "2 Admin Accounts"
    ]
  },
  {
    name: "Pro",
    duration: "1 Year",
    price: 48000,
    features: [
      "AI WhatsApp Agent Setup",
      "Voice & Text Reply",
      "Session Tracking",
      "Unlimited Admins",
      "Custom Integration Support"
    ]
  }
];

export default function PlanSelection() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);

  const handleNext = () => {
    if (!selected) return alert("Please select a plan");
    localStorage.setItem("selectedPlan", JSON.stringify(selected));
    navigate("/payment");
  };

  return (
    <div className="content-wrapper">
      <h1>Choose Your Plan</h1>
      <div className="plans-container">
        {plans.map((plan, i) => (
          <div
            key={i}
            className={`plan-card ${selected?.name === plan.name ? "selected" : ""}`}
            onClick={() => setSelected(plan)}
          >
            <h2>{plan.name}</h2>
            <p>{plan.duration}</p>
            <h3>₦{plan.price.toLocaleString()}</h3>
            <ul>
              {plan.features.map((f, j) => <li key={j}>{f}</li>)}
            </ul>
          </div>
        ))}
      </div>
      <button onClick={handleNext} className="btn green">Next</button>
    </div>
  );
}
