import React, { useState, useEffect } from "react";
import "./App.css";

const BACKEND_BASE = "https://watsappai2.onrender.com";

export default function Dashboard() {
  const [conversations, setConversations] = useState([]);
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load conversation list
  useEffect(() => {
    fetch(`${BACKEND_BASE}/api/conversations`)
      .then((res) => res.json())
      .then((data) => setConversations(data.conversations || []))
      .catch((err) => console.error("Error loading conversations:", err));
  }, []);

  // Load selected chat
  useEffect(() => {
    if (!selectedPhone) return;
    setLoading(true);
    fetch(`${BACKEND_BASE}/api/conversations/${selectedPhone}`)
      .then((res) => res.json())
      .then((data) => setChat(data.conversationHistory || []))
      .catch((err) => console.error("Error loading chat:", err))
      .finally(() => setLoading(false));
  }, [selectedPhone]);

  // Render one message (text / audio / video / image)
  const renderMessageContent = (msg) => {
    if (msg.type === "text") {
      return <p>{msg.content}</p>;
    }
    if (msg.type === "audio") {
      return <audio controls src={msg.content}></audio>;
    }
    if (msg.type === "video") {
      return <video controls src={msg.content} width="250"></video>;
    }
    if (msg.type === "image") {
      return <img src={msg.content} alt="attachment" width="200" />;
    }
    return <p>[Unsupported type]</p>;
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
            className={`sidebar-item ${
              selectedPhone === conv.phone ? "active" : ""
            }`}
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
