// src/Dashboard.jsx
import React, { useState, useEffect, useRef } from "react";

const BACKEND_BASE = "https://watsappai2.onrender.com";

export default function Dashboard() {
  const [conversations, setConversations] = useState([]);
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [highlightedMsg, setHighlightedMsg] = useState(null);

  const lastMessageCountRef = useRef(0);

  // 📌 Load all conversations
  const fetchConversations = () => {
    fetch(`${BACKEND_BASE}/api/conversations`)
      .then((res) => res.json())
      .then((data) => setConversations(data || []))
      .catch((err) => console.error("Error loading conversations:", err));
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000); // every 10s
    return () => clearInterval(interval);
  }, []);

  // 📌 Load chat for selected customer
  const fetchChat = () => {
    if (!selectedPhone) return;
    setLoading(true);
    fetch(`${BACKEND_BASE}/api/conversations/${selectedPhone}`)
      .then((res) => res.json())
      .then((data) => {
        const history = data.history || [];
        // Highlight new message
        if (history.length > lastMessageCountRef.current) {
          const newMsgIndex = history.length - 1;
          setHighlightedMsg(newMsgIndex);
          setTimeout(() => setHighlightedMsg(null), 2000);
        }
        lastMessageCountRef.current = history.length;
        setChat(history);
      })
      .catch((err) => console.error("Error loading chat:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!selectedPhone) return;
    lastMessageCountRef.current = 0;
    fetchChat();
    const interval = setInterval(fetchChat, 5000); // every 5s
    return () => clearInterval(interval);
  }, [selectedPhone]);

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Arial" }}>
      {/* Sidebar */}
      <div
        style={{
          width: "280px",
          borderRight: "1px solid #333",
          padding: "10px",
          overflowY: "auto",
          background: "#1e1e1e",
          color: "#fff",
        }}
      >
        <h3 style={{ marginBottom: "10px" }}>📱 Customers</h3>
        {conversations.map((conv) => (
          <div
            key={conv.phone}
            onClick={() => setSelectedPhone(conv.phone)}
            style={{
              padding: "10px",
              marginBottom: "6px",
              borderRadius: "6px",
              cursor: "pointer",
              background:
                selectedPhone === conv.phone ? "#2e7d32" : "#2c2c2c",
              color: "#fff",
            }}
          >
            <b>{conv.phone}</b>
            <p style={{ margin: 0, fontSize: "13px", color: "#ccc" }}>
              {conv.lastMessage || "No messages yet"}
            </p>
          </div>
        ))}
      </div>

      {/* Chat Window */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: "#121212", // dark background
          color: "#fff",
        }}
      >
        <div
          style={{
            flex: 1,
            padding: "20px",
            overflowY: "auto",
          }}
        >
          {!selectedPhone && <p>Select a customer to view chat</p>}
          {selectedPhone && (
            <>
              <h3 style={{ borderBottom: "1px solid #444", paddingBottom: "10px" }}>
                💬 Conversation with {selectedPhone}
              </h3>
              {loading ? (
                <p>Loading chat...</p>
              ) : (
                chat.map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      margin: "8px 0",
                      textAlign: msg.from === "ai" ? "right" : "left",
                    }}
                  >
                    <div
                      style={{
                        display: "inline-block",
                        padding: "10px",
                        borderRadius: "8px",
                        maxWidth: "70%",
                        background:
                          highlightedMsg === i
                            ? "#fff176" // yellow highlight
                            : msg.from === "ai"
                            ? "#2e7d32" // green for AI
                            : "#333", // dark grey for customer
                        color: "#fff",
                        border:
                          msg.from === "ai"
                            ? "1px solid #66bb6a"
                            : "1px solid #555",
                        transition: "background 0.3s ease",
                      }}
                    >
                      <p style={{ margin: 0 }}>{msg.text}</p>
                      {msg.audioUrl && (
                        <audio
                          controls
                          src={msg.audioUrl}
                          style={{
                            marginTop: "5px",
                            width: "100%",
                            background: "#222",
                          }}
                        />
                      )}
                      <div
                        style={{
                          fontSize: "11px",
                          marginTop: "4px",
                          color: "#bbb",
                        }}
                      >
                        {new Date(msg.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
