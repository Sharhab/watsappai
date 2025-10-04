import React, { useState } from "react";
import { BACKEND_BASE } from "./api";
import { useNavigate } from "react-router-dom";

export default function BusinessSetup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    businessName: "",
    whatsappNumber: "",
    category: "",
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch(`${BACKEND_BASE}/api/tenants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      alert("Business setup complete!");
      navigate("/qa");
    } else {
      alert("Setup failed");
    }
  };

  return (
    <div className="content-wrapper">
      <h1>Business Setup</h1>
      <form onSubmit={handleSubmit} className="form-card">
        <input name="businessName" placeholder="Business Name" onChange={handleChange} />
        <input name="whatsappNumber" placeholder="WhatsApp Number" onChange={handleChange} />
        <input name="category" placeholder="Business Category" onChange={handleChange} />
        <button className="btn green" type="submit">Save & Continue</button>
      </form>
    </div>
  );
}
