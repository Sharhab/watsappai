// src/PaymentMethod.jsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BACKEND_BASE } from "./api";
import { useAuth } from "./AuthContext";
import { jwtDecode } from "jwt-decode";
import "./App.css";

const handlePayment = async (method) => {
  if (!plan) return alert("No plan selected.");
  setError("");

  if (method === "card") setLoadingCard(true);
  if (method === "transfer") setLoadingTransfer(true);

  try {
    // 🧩 1. Ensure user exists
    let currentUser = user || JSON.parse(localStorage.getItem("user")) || {};
    let decoded = {};

    // 🧩 2. Decode token (safe)
    if (token) {
      try {
        decoded = jwtDecode(token);
      } catch (e) {
        console.warn("⚠️ Failed to decode token:", e.message);
      }
    }

    // 🧩 3. Merge info
    currentUser.email = currentUser.email || decoded.email || "";
    currentUser.id = currentUser.id || decoded.id || "";

    // 🧩 4. Fallback if still missing
    if (!currentUser.email) {
      console.error("❌ Missing user email — re-login required.");
      alert("Please log in again to continue payment.");
      localStorage.clear();
      window.location.href = "/login";
      return;
    }

    // 🧩 5. Send request
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
