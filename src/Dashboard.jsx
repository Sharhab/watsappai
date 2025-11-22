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

  // NEW: show only customer list first
  const [showListOnly, setShowListOnly] = useState(true);

  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const recordStartX = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "x-tenant-id": tenantId,
  };

  // auto-refresh customer list
  useEffect(() => {
    const fetchList = () => {
      fetch(`${BACKEND_BASE}/api/conversations`, { headers: authHeaders })
        .then((res) => res.json())
        .then((data) => setConversations(data.conversations || []))
        .catch((err) => console.warn("fetch conversations err:", err));
    };
    fetchList();
    const interval = setInterval(fetchList, 5000);
    return () => clearInterval(interval);
  }, []); // authHeaders stable per render from context

  // load chat when selectedPhone changes
  useEffect(() => {
    if (!selectedPhone) return;
    setLoading(true);
    fetch(`${BACKEND_BASE}/api/conversations/${selectedPhone}`, { headers: authHeaders })
      .then((res) => res.json())
      .then((data) => setChat(data.conversationHistory || []))
      .catch((err) => {
        console.warn("load chat err:", err);
        setChat([]);
      })
      .finally(() => setLoading(false));
  }, [selectedPhone]);

  // send text reply
  const sendReply = async () => {
    if (!messageInput.trim() || !selectedPhone) return;

    const msg = messageInput;
    setMessageInput("");

    try {
      await fetch(`${BACKEND_BASE}/api/messages/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ phone: selectedPhone, message: msg }),
      });
      // append locally for instant UI
      setChat((prev) => [...prev, { sender: "ai", type: "text", content: msg, timestamp: new Date() }]);
    } catch (err) {
      console.error("sendReply error:", err);
      // still append so operator sees the outgoing message (optional)
      setChat((prev) => [...prev, { sender: "ai", type: "text", content: msg, timestamp: new Date() }]);
    }
  };

  // recording handlers
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
    } catch (err) {
      console.warn("record start error:", err);
      alert("⚠️ Microphone permission required.");
    }
  };

  const handleTouchMove = (e) => {
    if (!isRecording) return;
    const currentX = e.touches ? e.touches[0].clientX : (e.clientX || 0);
    if (recordStartX.current - currentX > 80) {
      setCancelled(true);
      setIsRecording(false);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    }
  };

  const cancelRecording = () => {
    if (isRecording) {
      setCancelled(true);
      setIsRecording(false);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;
    setIsRecording(false);

    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();

    mediaRecorderRef.current.onstop = async () => {
      if (cancelled) return;

      const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const formData = new FormData();
      formData.append("phone", selectedPhone);
      formData.append("audio", blob, "voice-message.webm");

      try {
        await fetch(`${BACKEND_BASE}/api/messages/send-voice`, {
          method: "POST",
          headers: authHeaders,
          body: formData,
        });
      } catch (err) {
        console.warn("send-voice error:", err);
      }

      // show outgoing audio locally (object URL) in AI side (sent by operator)
      const url = URL.createObjectURL(blob);
      setChat((prev) => [...prev, { sender: "ai", type: "audio", content: url, timestamp: new Date() }]);
    };
  };

  // search convs
  const filteredConversations = conversations.filter(
    (c) => c.phone.includes(search) || (c.lastMessage || "").includes(search)
  );

  // render message content
  const renderMessageContent = (msg) => {
    if (!msg) return <p>[empty]</p>;
    const t = msg.type || "text";

    if (t === "text") {
      return <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{msg.content || "[empty]"}</p>;
    }

    if (t === "audio") {
      // audio player should be clearly visible and full width inside bubble
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <audio controls src={msg.content} style={{ width: "100%", maxWidth: 420 }} />
          {msg.meta?.transcriptConfidence !== undefined && (
            <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
              Confidence: {Number(msg.meta.transcriptConfidence).toFixed(2)}
            </div>
          )}
        </div>
      );
    }

    if (t === "video") {
      return <video controls width="420" src={msg.content} />;
    }

    if (t === "image") {
      return (
        <div>
          <a href={msg.content} target="_blank" rel="noreferrer">
            <img
              src={msg.content}
              alt="uploaded"
              style={{ maxWidth: "320px", width: "100%", borderRadius: 8, cursor: "pointer" }}
            />
          </a>
          {msg.meta?.ocrText && (
            <div style={{ marginTop: 6, fontSize: 13, color: "#333" }}>
              <strong>OCR:</strong> <span style={{ whiteSpace: "pre-wrap" }}>{msg.meta.ocrText}</span>
            </div>
          )}
        </div>
      );
    }

    return <p>[media]</p>;
  };

  // open chat (customer clicked)
  const openChat = (phone) => {
    setSelectedPhone(phone);
    setShowListOnly(false);
  };

  const goBack = () => {
    setSelectedPhone(null);
    setShowListOnly(true);
    setChat([]);
  };

  // helper: map session sender to CSS class user vs ai
  function senderClass(sender) {
    // server uses "customer" for customer messages, "ai" for assistant replies.
    if (!sender) return "ai";
    if (sender === "customer" || sender === "user") return "user"; // customer's bubble (right/green)
    return "ai"; // anything else treated as AI
  }

  return (
    <div className="chat-container">
      {/* LEFT SIDEBAR */}
      {showListOnly && (
        <div className="chat-sidebar">
          <h3>📱 Customers</h3>

          <input
            className="search-bar"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              marginBottom: "12px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          />

          {filteredConversations.map((c) => (
            <div
              key={c.phone}
              className={`sidebar-item ${selectedPhone === c.phone ? "active" : ""}`}
              onClick={() => openChat(c.phone)}
            >
              <b>{c.phone}</b>
              <p>{c.lastMessage || "No messages yet"}</p>
            </div>
          ))}
        </div>
      )}

      {/* RIGHT CHAT WINDOW */}
      {!showListOnly && (
        <>
          {/* BACK BUTTON */}
          <div
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              padding: "8px 12px",
              background: "#fff",
              borderRadius: 8,
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
              zIndex: 10,
            }}
            onClick={goBack}
          >
            ← Back
          </div>

          <div className="chat-window">
            <h3>Chat with {selectedPhone}</h3>

            {loading ? (
              <p>Loading…</p>
            ) : (
              chat.map((msg, i) => (
                <div key={i} className={`message ${senderClass(msg.sender)}`}>
                  {renderMessageContent(msg)}
                  <div className="timestamp">{new Date(msg.timestamp).toLocaleString()}</div>
                </div>
              ))
            )}

            {/* Message Input + Recording */}
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message…"
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: 6,
                    border: "1px solid #ccc",
                  }}
                />
                <button onClick={sendReply} className="btn green">Send</button>

                {/* Hold to Record */}
                <div
                  className="btn mic"
                  style={{ background: isRecording ? "#d9534f" : "#007bff", color: "#fff", padding: "8px 12px", borderRadius: 6, cursor: "pointer" }}
                  onMouseDown={startRecording}
                  onTouchStart={startRecording}
                  onMouseUp={stopRecording}
                  onTouchEnd={stopRecording}
                  onMouseLeave={cancelRecording}
                  onTouchMove={handleTouchMove}
                >
                  {isRecording ? "🎙 Recording…" : "🎤 Hold to Record"}
                </div>


              </div>

              {/* Recording indicator (waveform + cancel hint) */}
              {isRecording && (
                <div className="recording-indicator" style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="waveform" style={{ display: "flex", gap: 4, alignItems: "flex-end" }}>
                    {Array.from({ length: 12 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="wave-bar"
                        style={{
                          width: 6,
                          height: `${8 + (idx % 6) * 4}px`,
                          background: "#1890ff",
                          borderRadius: 3,
                          opacity: 0.85,
                          animation: `wave 1s ${idx * 0.08}s infinite`,
                        }}
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: 13, color: "#666" }}>← Slide left to cancel</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
