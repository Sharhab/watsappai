// src/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import "./App.css";

const BACKEND_BASE = "https://watsappai2.onrender.com";

export default function Dashboard() {
  const { token, tenantId } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ Auth headers
  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "x-tenant-id": tenantId,
  };

  // Load conversation list
  useEffect(() => {
    fetch(`${BACKEND_BASE}/api/conversations`, { headers: authHeaders })
      .then((res) => res.json())
      .then((data) => setConversations(data.conversations || []))
      .catch((err) => console.error("Error loading conversations:", err));
  }, []);

  // Load chat when a conversation is selected
  useEffect(() => {
    if (!selectedPhone) return;
    setLoading(true);

    fetch(`${BACKEND_BASE}/api/conversations/${selectedPhone}`, { headers: authHeaders })
      .then((res) => res.json())
      .then((data) => setChat(data.conversationHistory || []))
      .catch((err) => console.error("Error loading chat:", err))
      .finally(() => setLoading(false));
  }, [selectedPhone]);

useEffect(() => {
  console.log("🔍 CHAT DATA RECEIVED:", chat);
}, [chat]);

const renderMessageContent = (msg) => {
  if (!msg) return null;

  // ✅ If media type but content is missing, show placeholder
  if ((msg.type === "audio" || msg.type === "video" || msg.type === "image") && !msg.content) {
    return <p>[media missing]</p>;
  }

  switch (msg.type) {
    case "text":
      if (!msg.content || msg.content.trim() === "") return <p>[empty message]</p>;
      return <p>{msg.content}</p>;

    case "audio":
      return <audio controls src={msg.content} style={{ width: "200px" }} />;

    case "video":
      return <video controls width="250" src={msg.content} />;

    case "image":
      return <img src={msg.content} width="200" alt="sent" />;

    default:
      return <p>[unknown type: {msg.type}]</p>;
  }
};

  return (
    <div className="chat-container">
      {/* Sidebar */}
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

      {/* Chat window */}
      <div className="chat-window">
        {!selectedPhone && <p>Select a customer to view chat</p>}
        {selectedPhone && (
          <>
            <h3>💬 Conversation with {selectedPhone}</h3>
            {loading ? <p>Loading chat...</p> : (
              chat.map((msg, i) => (
                <div key={i} className={`message ${msg.sender === "ai" ? "ai" : "user"}`}>
                  {renderMessageContent(msg)}
                  <div className="timestamp">
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleString() : ""}
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
