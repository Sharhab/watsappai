// src/Dashboard.jsx
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";
import { io } from "socket.io-client";
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

  // Typing indicator for current chat
  const [typing, setTyping] = useState(false);

  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const recordStartX = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // file input ref for sending media
  const fileInputRef = useRef(null);

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "x-tenant-id": tenantId,
  };

  // socket ref
  const socketRef = useRef(null);

  // -------------------- Socket.IO connect --------------------
  useEffect(() => {
    if (!token) return;

    const socket = io(BACKEND_BASE, {
      extraHeaders: {
        Authorization: `Bearer ${token}`,
        "x-tenant-id": tenantId,
      },
      transports: ["websocket"],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      // subscribe tenant-wide room so sidebar receives tenant events
      if (tenantId) socket.emit("subscribe", { tenantId });
    });

    socket.on("new_message", (payload) => {
      // payload: { phone, message }
      const phone = payload.phone;
      appendMessageToUI(phone, payload.message);

      // quickly update sidebar preview + unread
      updateSidebarUnread(phone, payload.message);
    });

    socket.on("unread_update", (payload) => {
      setConversations((prev) =>
        prev.map((c) => (c.phone === payload.phone ? { ...c, unread: payload.unread } : c))
      );
    });

    socket.on("online_status", (payload) => {
      setConversations((prev) =>
        prev.map((c) => (c.phone === payload.phone ? { ...c, online: payload.status === "online" } : c))
      );
    });

    socket.on("typing", (payload) => {
      // payload: { phone, typing }
      if (selectedPhone === payload.phone) setTyping(!!payload.typing);
    });

    socket.on("disconnect", () => {
      // socket disconnected
    });

    return () => {
      try {
        if (tenantId) socket.emit("unsubscribe", { tenantId });
      } catch {}
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, tenantId, selectedPhone]);

  // -------------------- fetch conversations list --------------------
  useEffect(() => {
    const fetchList = () => {
      fetch(`${BACKEND_BASE}/api/conversations`, { headers: authHeaders })
        .then((res) => res.json())
        .then((data) => {
          // ensure unread & online exist on each item
          const convs = (data.conversations || []).map((c) => ({
            unread: 0,
            online: false,
            ...c,
          }));
          setConversations(convs);
        })
        .catch((err) => console.warn("fetch conversations err:", err));
    };
    fetchList();
    const interval = setInterval(fetchList, 5000);
    return () => clearInterval(interval);
    // authHeaders is stable across renders because token/tenantId come from context
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, tenantId]);

  // -------------------- load chat when selectedPhone changes --------------------
  useEffect(() => {
    if (!selectedPhone) return;
    setLoading(true);
    fetch(`${BACKEND_BASE}/api/conversations/${selectedPhone}`, { headers: authHeaders })
      .then((res) => res.json())
      .then((data) => {
        setChat(data.conversationHistory || []);
        // notify backend we're viewing (to mark read)
        fetch(`${BACKEND_BASE}/api/conversations/${selectedPhone}/mark-read`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
        }).catch(() => {});
        // subscribe to phone room for live updates specific to this chat
        if (socketRef.current) socketRef.current.emit("subscribe", { phone: selectedPhone });
      })
      .catch((err) => {
        console.warn("load chat err:", err);
        setChat([]);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPhone]);

  // -------------------- helpers: append message + update sidebar --------------------
  function appendMessageToUI(phone, message) {
    // If the message belongs to the currently-open chat — append it.
    if (selectedPhone === phone) {
      setChat((prev) => [...prev, message]);
      return;
    }

    // Otherwise update the sidebar preview/unread (optimistic)
    setConversations((prev) => {
      const exists = prev.find((c) => c.phone === phone);
      const preview =
        message.type === "text"
          ? (message.content || "").toString().slice(0, 80)
          : message.type === "audio"
          ? "🎤 Voice Message"
          : message.type === "image"
          ? "🖼 Image"
          : message.type === "video"
          ? "🎞 Video"
          : "[media]";

      if (exists) {
        return prev.map((c) =>
          c.phone === phone
            ? { ...c, lastMessage: preview, lastTimestamp: message.timestamp || Date.now(), unread: (c.unread || 0) + 1 }
            : c
        );
      } else {
        // insert new conversation at top
        return [
          {
            phone,
            lastMessage: preview,
            lastType: message.type || "text",
            lastTimestamp: message.timestamp || Date.now(),
            unread: 1,
            online: true,
          },
          ...prev,
        ];
      }
    });
  }

  function updateSidebarUnread(phone, message) {
    // called when new_message event arrives — we already increment in appendMessageToUI,
    // but this ensures other UI pieces get updated too.
    setConversations((prev) =>
      prev.map((c) =>
        c.phone === phone
          ? {
              ...c,
              lastMessage:
                message.type === "text"
                  ? (message.content || "").toString().slice(0, 80)
                  : message.type === "audio"
                  ? "🎤 Voice Message"
                  : message.type === "image"
                  ? "🖼 Image"
                  : "🎞 Video",
              lastTimestamp: message.timestamp || Date.now(),
              unread: (c.unread || 0) + (selectedPhone === phone ? 0 : 1),
            }
          : c
      )
    );
  }

  // -------------------- send text --------------------
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
      // optionally emit typing=false
      if (socketRef.current) socketRef.current.emit("typing", { phone: selectedPhone, typing: false });
    } catch (err) {
      console.error("sendReply error:", err);
      setChat((prev) => [...prev, { sender: "ai", type: "text", content: msg, timestamp: new Date() }]);
    }
  };

  // -------------------- recording handlers (unchanged logic) --------------------
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

      // tell remote typing state (operator is "typing"/recording)
      if (socketRef.current && selectedPhone) socketRef.current.emit("typing", { phone: selectedPhone, typing: true });
    } catch (err) {
      console.warn("record start error:", err);
      alert("⚠️ Microphone permission required.");
    }
  };

  const handleTouchMove = (e) => {
    if (!isRecording) return;
    const currentX = e.touches ? e.touches[0].clientX : e.clientX || 0;
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
      if (socketRef.current && selectedPhone) socketRef.current.emit("typing", { phone: selectedPhone, typing: false });
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;
    setIsRecording(false);

    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();

    mediaRecorderRef.current.onstop = async () => {
      if (cancelled) {
        if (socketRef.current && selectedPhone) socketRef.current.emit("typing", { phone: selectedPhone, typing: false });
        return;
      }

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

      if (socketRef.current && selectedPhone) socketRef.current.emit("typing", { phone: selectedPhone, typing: false });
    };
  };

  // -------------------- send image/video --------------------
  const handleMediaSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPhone) return;

    const form = new FormData();
    form.append("phone", selectedPhone);
    form.append("media", file);

    // optimistic local show
    const localUrl = URL.createObjectURL(file);
    const fileType = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "file";
    setChat((prev) => [...prev, { sender: "ai", type: fileType, content: localUrl, timestamp: new Date(), pending: true }]);

    try {
      await fetch(`${BACKEND_BASE}/api/messages/send-media`, {
        method: "POST",
        headers: authHeaders,
        body: form,
      });
    } catch (err) {
      console.warn("send-media error:", err);
    } finally {
      // the server will emit a new_message event with the real cloud URL — which will be appended
    }
  };

  // -------------------- search + filtered list --------------------
  const filteredConversations = conversations.filter(
    (c) => c.phone.includes(search) || (c.lastMessage || "").toLowerCase().includes(search.toLowerCase())
  );

  // -------------------- render message content --------------------
  const renderMessageContent = (msg) => {
    if (!msg) return <p>[empty]</p>;
    const t = msg.type || "text";

    if (t === "text") {
      return <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{msg.content || "[empty]"}</p>;
    }

    if (t === "audio") {
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

  // -------------------- open chat / go back (subscribe/unsubscribe) --------------------
  const openChat = (phone) => {
    setSelectedPhone(phone);
    setShowListOnly(false);
    // join phone room to receive events specific to this phone
    if (socketRef.current) socketRef.current.emit("subscribe", { phone });
    // mark unread as 0 locally
    setConversations((prev) => prev.map((c) => (c.phone === phone ? { ...c, unread: 0 } : c)));
  };

  const goBack = () => {
    if (socketRef.current && selectedPhone) socketRef.current.emit("unsubscribe", { phone: selectedPhone });
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

  // -------------------- UI --------------------
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
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}
            >
              <div>
                <b>{c.phone}</b>
                <p style={{ margin: 0 }}>{c.lastMessage || "No messages yet"}</p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                {/* online dot */}
                <div style={{ fontSize: 12 }}>
                  {c.online ? <span style={{ color: "#2ecc71" }}>● online</span> : <span style={{ color: "#999" }}>offline</span>}
                </div>
                {/* unread badge */}
                {c.unread > 0 && (
                  <div style={{ background: "#e74c3c", color: "#fff", padding: "4px 8px", borderRadius: 12, fontSize: 12 }}>
                    {c.unread}
                  </div>
                )}
              </div>
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
                  onChange={(e) => {
                    setMessageInput(e.target.value);
                    // emit typing
                    if (socketRef.current && selectedPhone) socketRef.current.emit("typing", { phone: selectedPhone, typing: !!e.target.value });
                  }}
                  placeholder="Type a message…"
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: 6,
                    border: "1px solid #ccc",
                  }}
                />
                <button onClick={sendReply} className="btn green">
                  Send
                </button>

                {/* file input (image/video) */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  style={{ display: "none" }}
                  onChange={handleMediaSelect}
                />
                <button
                  className="btn"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  title="Send image / video"
                >
                  📎
                </button>

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

              {/* Typing indicator */}
              {typing && (
                <div style={{ marginTop: 8, color: "#666", fontSize: 13 }}>
                  Customer is typing...
                </div>
              )}

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
