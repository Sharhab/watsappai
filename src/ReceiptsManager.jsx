import React, { useState } from "react";
import useReceipts from "./order";

export default function ReceiptsManager() {
  const [phone, setPhone] = useState("");
  const receipts = useReceipts(phone);

  return (
    <div className="content-wrapper">
      <h1>💳 Customer Receipts</h1>
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Phone e.g. +234..."
      />
      {phone && receipts.length === 0 && <p>No receipts found.</p>}
      {receipts.map((order) => (
        <div key={order._id} className="qa-card">
          <p><b>Amount:</b> ₦{order.receiptExtract?.paidAmount}</p>
          <p><b>Payer:</b> {order.receiptExtract?.payerAccount}</p>
          <p><b>Date:</b> {order.receiptExtract?.transactionDate}</p>
          <p>
            <a href={order.receiptUrl} target="_blank" rel="noreferrer">
              View Receipt
            </a>
          </p>
        </div>
      ))}
    </div>
  );
}
