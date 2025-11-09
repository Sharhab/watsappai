import React, { useState, useEffect } from "react";
import "./App.css";

const BACKEND_BASE = "https://watsappai2.onrender.com";

export default function Dashboard() {
  const [conversations, setConversations] = useState([]);
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ Get tenant from login
  const tenant = localStorage.getItem("tenant");

  // ✅ Load conversations list (tenant-aware)
  useEffect(() => {
    if (!tenant) return;
    fetch(`${BACKEND_BASE}/api/${tenant}/conversations`)
      .then((res) => res.json())
      .then((data) => setConversations(data.conversations || []))
      .catch((err) => console.error("Error loading conversations:", err));
  }, [tenant]);

  // ✅ Load selected chat
  useEffect(() => {
    if (!selectedPhone || !tenant) return;
    setLoading(true);
    fetch(`${BACKEND_BASE}/api/${tenant}/conversations/${selectedPhone}`)
      .then((res) => res.json())
      .then((data) => setChat(data.conversationHistory || []))
      .catch((err) => console.error("Error loading chat:", err))
      .finally(() => setLoading(false));
  }, [selectedPhone, tenant]);

  // ✅ Render message based on type
  const renderMessageContent = (msg) => {
    if (msg.type === "text") return <p>{msg.content}</p>;
    if (msg.type === "audio")
      return <audio controls src={msg.content} />;
    if (msg.type === "video")
      return <video controls width="250" src={msg.content} />;
    if (msg.type === "image")
      return <img width="200" src={msg.content} alt="attachment" />;

    return <p>[Unsupported type]</p>;
  };

  return (
    <div className="chat-container">
      {/* LEFT SIDEBAR */}
      <div className="chat-sidebar">
        <h3>📱 Customers</h3>

        {conversations.map((conv) => (
          <div
            key={conv.phone}
            onClick={() => setSelectedPhone(conv.phone)}
            className={`sidebar-item ${
              selectedPhone === conv.phone ? "active" : ""
            }`}
          >
            <b>{conv.phone}</b>
            <p>{conv.lastMessage || "No messages yet"}</p>
          </div>
        ))}
      </div>

      {/* CHAT WINDOW */}
      <div className="chat-window">
        {!selectedPhone && <p>Select a customer to view chat</p>}

        {selectedPhone && (
          <>
            <h3>💬 Conversation with {selectedPhone}</h3>

            {loading ? (
              <p>Loading chat...</p>
            ) : (
              chat.map((msg, i) => (
                <div
                  key={i}
                  className={`message ${msg.sender === "ai" ? "ai" : "user"}`}
                >
                  {renderMessageContent(msg)}

                  <div className="timestamp">
                    {msg.timestamp
                      ? new Date(msg.timestamp).toLocaleString()
                      : ""}
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
