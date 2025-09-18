// src/hooks/useReceipts.js
import { useEffect, useState } from "react";

const BACKEND_BASE = "https://watsappai2.onrender.com";

export default function useReceipts(phone) {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!phone) return; // skip if no phone provided

    fetch(`${BACKEND_BASE}/api/orders?phone=${phone}`)
      .then((res) => res.json())
      .then((data) => setOrders(data.orders || []))
      .catch((err) => console.error("Failed to load receipts:", err));
  }, [phone]);

  return orders;
}
