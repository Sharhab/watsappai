// src/Dashboard.jsx
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";
import "./App.css";

const BACKEND_BASE = "https://watsappai2.onrender.com";

export default function Dashboard() {
  const { token, tenantId } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [search, setSearch] = useState("");

  // 🎤 Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const recordStartX = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "x-tenant-id": tenantId,
  };

  // 🟢 Auto-refresh conversations
  useEffect(() => {
    const fetchList = () => {
      fetch(`${BACKEND_BASE}/api/conversations`, { headers: authHeaders })
        .then((res) => res.json())
        .then((data) => setConversations(data.conversations || []));
    };
    fetchList();
    const interval = setInterval(fetchList, 5000);
    return () => clearInterval(interval);
  }, []);

  // 🟢 Load Chat
  useEffect(() => {
    if (!selectedPhone) return;
    setLoading(true);
    fetch(`${BACKEND_BASE}/api/conversations/${selectedPhone}`, { headers: authHeaders })
      .then((res) => res.json())
      .then((data) => setChat(data.conversationHistory || []))
      .finally(() => setLoading(false));
  }, [selectedPhone]);

  // ✉️ Send Text
  const sendReply = async () => {
    if (!messageInput.trim()) return;
    const msg = messageInput;
    setMessageInput("");

    await fetch(`${BACKEND_BASE}/api/messages/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ phone: selectedPhone, message: msg }),
    });

    setChat((prev) => [...prev, { sender: "ai", type: "text", content: msg, timestamp: new Date() }]);
  };

  // 🎤 Start recording
  const startRecording = async (e) => {
    setCancelled(false);
    recordStartX.current = e.touches ? e.touches[0].clientX : e.clientX;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (ev) => audioChunksRef.current.push(ev.data);
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch {
      alert("⚠️ Microphone permission required.");
    }
  };

  // 👆 Slide Left to Cancel
  const handleTouchMove = (e) => {
    if (!isRecording) return;
    const currentX = e.touches[0].clientX;
    if (recordStartX.current - currentX > 80) {
      setCancelled(true);
      setIsRecording(false);
      mediaRecorderRef.current.stop();
    }
  };

  // 🟥 Cancel Recording
  const cancelRecording = () => {
    if (isRecording) {
      setCancelled(true);
      setIsRecording(false);
      mediaRecorderRef.current.stop();
    }
  };

  // ✅ Stop + Send Recording
  const stopRecording = async () => {
    if (!isRecording) return;
    setIsRecording(false);

    mediaRecorderRef.current.stop();

    mediaRecorderRef.current.onstop = async () => {
      if (cancelled) return;

      const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });

      const formData = new FormData();
      formData.append("phone", selectedPhone);
      formData.append("audio", blob, "voice-message.webm");

      await fetch(`${BACKEND_BASE}/api/messages/send-voice`, {
        method: "POST",
        headers: authHeaders,
        body: formData,
      });

      const url = URL.createObjectURL(blob);
      setChat((prev) => [...prev, { sender: "ai", type: "audio", content: url, timestamp: new Date() }]);
    };
  };

  // 🔍 Search conversations
  const filteredConversations = conversations.filter(
    (c) => c.phone.includes(search) || (c.lastMessage || "").includes(search)
  );

  const renderMessageContent = (msg) => {
    switch (msg.type) {
      case "text":
        return <p>{msg.content || "[empty]"}</p>;
      case "audio":
        return <audio controls src={msg.content} style={{ width: "220px" }} />;
      case "video":
        return <video controls width="250" src={msg.content} />;
      default:
        return <p>[media]</p>;
    }
  };

  return (
    <div className="chat-container">

      {/* Sidebar */}
      <div className="chat-sidebar">
        <h3>📱 Customers</h3>
        <input className="search-bar" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
        {filteredConversations.map((conv) => (
          <div key={conv.phone} onClick={() => setSelectedPhone(conv.phone)}
            className={`sidebar-item ${selectedPhone === conv.phone ? "active" : ""}`}>
            <b>{conv.phone}</b>
            <p>{conv.lastMessage}</p>
          </div>
        ))}
      </div>

      {/* Chat Window */}
      <div className="chat-window">
        {!selectedPhone && <p>Select a customer to view chat</p>}

        {selectedPhone && (
          <>
            <h3>💬 Chat with {selectedPhone}</h3>

            {loading ? <p>Loading…</p> : chat.map((msg, i) => (
              <div key={i} className={`message ${msg.sender === "ai" ? "ai" : "user"}`}>
                {renderMessageContent(msg)}
                <div className="timestamp">{new Date(msg.timestamp).toLocaleString()}</div>
              </div>
            ))}

            {/* Message Input */}
            <div className="message-input">

              <input value={messageInput} onChange={(e) => setMessageInput(e.target.value)} placeholder="Type reply…" />
              <button className="btn green" onClick={sendReply}>Send</button>

              {/* Hold to Record */}
              <div
                className="btn mic"
                style={{ background: isRecording ? "#d9534f" : "#007bff" }}
                onMouseDown={startRecording}
                onTouchStart={startRecording}
                onMouseUp={stopRecording}
                onTouchEnd={stopRecording}
                onMouseLeave={cancelRecording}
                onTouchMove={handleTouchMove}
              >
                {isRecording ? "🎙 Recording…" : "🎤 Hold to Record"}
              </div>

              {isRecording && (
                <div className="recording-indicator">
                  <div className="waveform">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="wave-bar" style={{ animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </div>
                  <span className="cancel-record">← Slide left to cancel</span>
                </div>
              )}

            </div>
          </>
        )}
      </div>
    </div>
  );
}
