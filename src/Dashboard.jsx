import React, { useState, useEffect } from "react";
import "./App.css";

const BACKEND_BASE = "https://watsappai2.onrender.com";

export default function Dashboard() {
  const [conversations, setConversations] = useState([]);
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${BACKEND_BASE}/api/conversations`)
      .then((res) => res.json())
      .then((data) => setConversations(data.conversations || []))
      .catch((err) => console.error("Error loading conversations:", err));
  }, []);

  useEffect(() => {
    if (!selectedPhone) return;
    setLoading(true);
    fetch(`${BACKEND_BASE}/api/conversations/${selectedPhone}`)
      .then((res) => res.json())
      .then((data) => setChat(data.history || []))
      .catch((err) => console.error("Error loading chat:", err))
      .finally(() => setLoading(false));
  }, [selectedPhone]);

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <h3>📱 Customers</h3>
        {conversations.map((conv) => (
          <div
            key={conv.phone}
            onClick={() => setSelectedPhone(conv.phone)}
            className={`sidebar-item ${selectedPhone === conv.phone ? "active" : ""}`}
          >
            <b>{conv.phone}</b>
            <p>{conv.lastMessage || "No messages yet"}</p>
          </div>
        ))}
      </div>
      <div className="chat-window">
        {!selectedPhone && <p>Select a customer to view chat</p>}
        {selectedPhone && (
          <>
            <h3>💬 Conversation with {selectedPhone}</h3>
            {loading ? (
              <p>Loading chat...</p>
            ) : (
              chat.map((msg, i) => (
                <div key={i} className={`message ${msg.from === "ai" ? "ai" : "user"}`}>
                  {msg.text}
                  <div className="timestamp">
                    {new Date(msg.timestamp).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
