// src/App.jsx
import React, { useEffect, useState } from "react";
import useReceipts from "./order";
import Dashboard from "./Dashboard";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";

const BACKEND_BASE = "https://watsappai2.onrender.com";
const API_URL = `${BACKEND_BASE}/api/qas`;
const INTRO_URL = `${BACKEND_BASE}/api/intro`;

const resolveUrl = (u) => {
  if (!u) return null;
  if (u.startsWith("http")) return u;
  return `${BACKEND_BASE}${u.startsWith("/") ? u : `/${u}`}`;
};

export default function App() {
  // Sidebar toggle
  const [navOpen, setNavOpen] = useState(true);

  // QAs
  const [qas, setQAs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Create QA form state
  const [question, setQuestion] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [answerAudio, setAnswerAudio] = useState(null);

  // Edit QA state
  const [editId, setEditId] = useState(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswerText, setEditAnswerText] = useState("");
  const [editAnswerAudio, setEditAnswerAudio] = useState(null);
  const [editExistingAudioUrl, setEditExistingAudioUrl] = useState(null);

  // Intro sequence form state
  const [sequence, setSequence] = useState([
    { type: "video", file: null }, // step 0
    { type: "video", file: null }, // step 1
    { type: "audio", file: null }, // step 2
    { type: "audio", file: null }, // step 3
    { type: "text", content: "" }, // step 4
    { type: "audio", file: null }, // step 5
  ]);

  // Intro data for preview
  const [intro, setIntro] = useState([]);

  // Receipts
  const [phone, setPhone] = useState("");
  const receipts = useReceipts(phone);

  // Load Intro
  useEffect(() => {
    fetch(INTRO_URL)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.sequence) setIntro(data.sequence);
        else setIntro([]);
      })
      .catch((err) => console.error("Error loading intro:", err));
  }, []);

  // Load QAs
  useEffect(() => {
    setLoading(true);
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => setQAs(data))
      .catch((err) => console.error("Error loading QAs:", err))
      .finally(() => setLoading(false));
  }, []);

  // -------- Handlers

  // Add QA
  const handleAddQA = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("question", question);
      formData.append("answerText", answerText);
      if (answerAudio) formData.append("answerAudio", answerAudio);

      const res = await fetch(API_URL, { method: "POST", body: formData });
      if (!res.ok) throw new Error("Failed to create QA");

      const newQA = await res.json();
      setQAs((prev) => [...prev, newQA]);

      // reset
      setQuestion("");
      setAnswerText("");
      setAnswerAudio(null);
    } catch (err) {
      console.error(err);
      alert("Failed to add QA");
    }
  };

  // Begin edit
  const startEdit = (qa) => {
    setEditId(qa._id);
    setEditQuestion(qa.question || "");
    setEditAnswerText(qa.answerText || "");
    setEditAnswerAudio(null);
    setEditExistingAudioUrl(qa.answerAudio || null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditId(null);
    setEditQuestion("");
    setEditAnswerText("");
    setEditAnswerAudio(null);
    setEditExistingAudioUrl(null);
  };

  // Update QA
  const handleUpdateQA = async (e) => {
    e.preventDefault();
    if (!editId) return;

    try {
      const formData = new FormData();
      formData.append("question", editQuestion);
      formData.append("answerText", editAnswerText);
      if (editAnswerAudio) formData.append("answerAudio", editAnswerAudio);

      const res = await fetch(`${API_URL}/${editId}`, {
        method: "PUT",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to update QA");

      const updated = await res.json();
      setQAs((prev) => prev.map((q) => (q._id === editId ? updated : q)));
      cancelEdit();
    } catch (err) {
      console.error(err);
      alert("Failed to update QA");
    }
  };

  // Delete QA
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this QA?")) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete QA");
      setQAs((prev) => prev.filter((qa) => qa._id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete QA");
    }
  };

  // Save Intro
  const handleSaveIntro = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      sequence.forEach((step, i) => {
        if (step.type === "text") {
          formData.append(`step${i}_content`, step.content);
        } else if (step.file) {
          formData.append(`step${i}_file`, step.file);
        }
      });
      formData.append(
        "sequence",
        JSON.stringify(
          sequence.map((s) => ({ type: s.type, content: s.content || null }))
        )
      );

      const res = await fetch(`${BACKEND_BASE}/api/intro`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if (data && data.intro && data.intro.sequence) {
        setIntro(data.intro.sequence);
      }
    } catch (err) {
      console.error("❌ Upload failed:", err);
    }
  };

  // Sequence field handlers
  const handleFileChange = (index, file) => {
    setSequence((prev) => {
      const updated = [...prev];
      updated[index].file = file;
      return updated;
    });
  };
  const handleTextChange = (index, value) => {
    setSequence((prev) => {
      const updated = [...prev];
      updated[index].content = value;
      return updated;
    });
  };

  // -------- UI

  return (
    <BrowserRouter>
      {/* Toggle button (fixed) */}
      <button
        onClick={() => setNavOpen((v) => !v)}
        title={navOpen ? "Hide menu" : "Show menu"}
        style={{
          position: "fixed",
          top: 12,
          left: navOpen ? 232 : 72,
          transform: "translateX(-50%)",
          zIndex: 1001,
          background: "#0066cc",
          color: "#fff",
          border: "none",
          borderRadius: "20px",
          padding: "8px 12px",
          cursor: "pointer",
          transition: "left 0.25s ease",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        }}
      >
        {navOpen ? "◀ Hide" : "☰ Menu"}
      </button>

      <div style={{ display: "flex", minHeight: "100vh" }}>
        {/* Sidebar */}
        <aside
          style={{
            width: navOpen ? 220 : 60,
            background: "#222",
            color: "#fff",
            padding: "20px 12px",
            position: "fixed",
            top: 0,
            left: 0,
            bottom: 0,
            overflowY: "auto",
            transition: "width 0.25s ease",
          }}
        >
          <div
            style={{
              fontSize: navOpen ? "18px" : "0px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              marginBottom: "18px",
              transition: "font-size 0.25s ease",
            }}
          >
            📋 Menu
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <NavLink
              to="/"
              style={({ isActive }) => ({
                color: "#fff",
                textDecoration: "none",
                background: isActive ? "#444" : "transparent",
                borderRadius: "6px",
                padding: "8px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                justifyContent: navOpen ? "flex-start" : "center",
              })}
            >
              <span role="img" aria-label="home">
                🏠
              </span>
              {navOpen && <span>Q&A Manager</span>}
            </NavLink>
            <NavLink
              to="/dashboard"
              style={({ isActive }) => ({
                color: "#fff",
                textDecoration: "none",
                background: isActive ? "#444" : "transparent",
                borderRadius: "6px",
                padding: "8px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                justifyContent: navOpen ? "flex-start" : "center",
              })}
            >
              <span role="img" aria-label="dashboard">
                📊
              </span>
              {navOpen && <span>Dashboard</span>}
            </NavLink>
          </nav>
        </aside>

        {/* Main Content */}
        <main
          style={{
            marginLeft: navOpen ? 220 : 60,
            transition: "margin-left 0.25s ease",
            flex: 1,
            padding: "20px",
          }}
        >
          <Routes>
            <Route
              path="/"
              element={
                <div
                  style={{
                    fontFamily: "Arial, sans-serif",
                    maxWidth: "900px",
                    margin: "auto",
                  }}
                >
                  <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
                    Herbal Medicine Q&A Manager
                  </h1>

                  {/* CREATE QA FORM (styled as before) */}
                  <form
                    onSubmit={handleAddQA}
                    style={{
                      display: editId ? "none" : "flex",
                      flexDirection: "column",
                      gap: "10px",
                      marginBottom: "30px",
                      padding: "15px",
                      border: "1px solid #ccc",
                      borderRadius: "8px",
                      background: "#fff",
                    }}
                  >
                    <h3 style={{ margin: 0 }}>Add New QA</h3>
                    <input
                      type="text"
                      placeholder="Question"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      style={{ padding: "10px", fontSize: "14px" }}
                      required
                    />
                    <textarea
                      placeholder="Answer Text"
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      style={{ padding: "10px", fontSize: "14px" }}
                      rows="3"
                    />
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) =>
                        setAnswerAudio(e.target.files[0] || null)
                      }
                    />
                    <button
                      type="submit"
                      style={{
                        padding: "10px",
                        background: "green",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                      }}
                    >
                      Add QA
                    </button>
                  </form>

                  {/* EDIT QA FORM */}
                  {editId && (
                    <form
                      onSubmit={handleUpdateQA}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        marginBottom: "30px",
                        padding: "15px",
                        border: "1px solid #ccc",
                        borderRadius: "8px",
                        background: "#fffef5",
                      }}
                    >
                      <h3 style={{ margin: 0 }}>Edit QA</h3>
                      <input
                        type="text"
                        placeholder="Question"
                        value={editQuestion}
                        onChange={(e) => setEditQuestion(e.target.value)}
                        style={{ padding: "10px", fontSize: "14px" }}
                        required
                      />
                      <textarea
                        placeholder="Answer Text"
                        value={editAnswerText}
                        onChange={(e) => setEditAnswerText(e.target.value)}
                        style={{ padding: "10px", fontSize: "14px" }}
                        rows="3"
                      />
                      <div style={{ fontSize: "13px" }}>
                        <div style={{ marginBottom: "6px" }}>
                          Current audio:
                          {editExistingAudioUrl ? (
                            <audio
                              controls
                              src={resolveUrl(editExistingAudioUrl)}
                              style={{ display: "block", marginTop: "6px" }}
                            />
                          ) : (
                            <span style={{ marginLeft: 6, color: "#888" }}>
                              None
                            </span>
                          )}
                        </div>
                        <label>
                          Replace audio (optional):
                          <input
                            type="file"
                            accept="audio/*"
                            onChange={(e) =>
                              setEditAnswerAudio(e.target.files[0] || null)
                            }
                            style={{ display: "block", marginTop: "6px" }}
                          />
                        </label>
                      </div>

                      <div style={{ display: "flex", gap: "10px" }}>
                        <button
                          type="submit"
                          style={{
                            padding: "10px",
                            background: "#0066cc",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer",
                          }}
                        >
                          Save Changes
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          style={{
                            padding: "10px",
                            background: "#999",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer",
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {/* QA LIST HEADER */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "10px",
                    }}
                  >
                    <h2 style={{ margin: 0 }}>Saved QAs</h2>
                    {loading && (
                      <span style={{ fontSize: 12, color: "#777" }}>
                        &nbsp;Loading…
                      </span>
                    )}
                  </div>

                  {/* QA LIST */}
                  <ul style={{ listStyle: "none", padding: 0 }}>
                    {qas.map((qa) => (
                      <li
                        key={qa._id}
                        style={{
                          marginBottom: "15px",
                          padding: "10px",
                          border: "1px solid #ddd",
                          borderRadius: "8px",
                          background: "#333",
                        }}
                      >
                        <div style={{ marginBottom: 6 }}>
                          <strong>Q:</strong> {qa.question}
                        </div>
                        <div style={{ marginBottom: 6 }}>
                          <strong>A:</strong>{" "}
                          {qa.answerText || <em>(no text)</em>}
                        </div>

                        {qa.answerAudio ? (
                          <div style={{ marginTop: 6 }}>
                            <audio controls src={resolveUrl(qa.answerAudio)} />
                          </div>
                        ) : (
                          <div
                            style={{ color: "red", fontSize: "14px", marginTop: 6 }}
                          >
                            ⚠️ No audio uploaded
                          </div>
                        )}

                        <div
                          style={{ marginTop: "10px", display: "flex", gap: "8px" }}
                        >
                          <button
                            onClick={() => startEdit(qa)}
                            style={{
                              padding: "6px 10px",
                              background: "#0066cc",
                              color: "white",
                              border: "none",
                              borderRadius: "5px",
                              cursor: "pointer",
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(qa._id)}
                            style={{
                              padding: "6px 10px",
                              background: "red",
                              color: "white",
                              border: "none",
                              borderRadius: "5px",
                              cursor: "pointer",
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {/* INTRO FORM */}
                  <form
                    onSubmit={handleSaveIntro}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "15px",
                      padding: "20px",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      marginTop: "30px",
                      background: "#333",
                      color: "#fff",
                    }}
                  >
                    <h3 style={{ margin: 0 }}>Upload Intro Sequence</h3>

                    <label>
                      Video 1:
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => handleFileChange(0, e.target.files[0])}
                        required
                        style={{ display: "block", marginTop: 6 }}
                      />
                    </label>

                    <label>
                      Video 2:
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => handleFileChange(1, e.target.files[0])}
                        required
                        style={{ display: "block", marginTop: 6 }}
                      />
                    </label>

                    <label>
                      Audio 1:
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => handleFileChange(2, e.target.files[0])}
                        required
                        style={{ display: "block", marginTop: 6 }}
                      />
                    </label>

                    <label>
                      Audio 2:
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => handleFileChange(3, e.target.files[0])}
                        required
                        style={{ display: "block", marginTop: 6 }}
                      />
                    </label>

                    <label>
                      Payment Text:
                      <textarea
                        placeholder="Enter payment details"
                        value={sequence[4]?.content || ""}
                        onChange={(e) => handleTextChange(4, e.target.value)}
                        required
                        style={{
                          width: "100%",
                          minHeight: "80px",
                          padding: "8px",
                          display: "block",
                          marginTop: 6,
                        }}
                      />
                    </label>

                    <label>
                      Closing Audio:
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => handleFileChange(5, e.target.files[0])}
                        required
                        style={{ display: "block", marginTop: 6 }}
                      />
                    </label>

                    <button
                      type="submit"
                      style={{
                        padding: "10px 15px",
                        background: "green",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                        fontWeight: "bold",
                      }}
                    >
                      Save Intro
                    </button>
                  </form>

                  {/* INTRO PREVIEW */}
                  <div
                    style={{
                      marginTop: "30px",
                      padding: "20px",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      background: "#333",
                      color: "white",
                    }}
                  >
                    <h3 style={{ margin: "0 0 15px 0" }}>📽 Intro Sequence</h3>
                    {intro.length === 0 ? (
                      <p>No intro uploaded yet.</p>
                    ) : (
                      <ul style={{ listStyle: "none", padding: 0, marginTop: "20px" }}>
                        {intro.map((step, i) => {
                          const url = resolveUrl(step.fileUrl);
                          return (
                            <li
                              key={i}
                              style={{
                                border: "1px solid #ccc",
                                borderRadius: "8px",
                                padding: "10px",
                                background: "#444",
                                color: "white",
                                marginBottom: "12px",
                              }}
                            >
                              <p style={{ fontWeight: "bold", marginBottom: "8px" }}>
                                Step {i + 1}: {step.type}
                              </p>

                              {step.type === "text" && (
                                <p style={{ margin: 0 }}>{step.content}</p>
                              )}

                              {step.type === "video" &&
                                (url ? (
                                  <video
                                    controls
                                    src={url}
                                    style={{ width: "250px", borderRadius: "8px" }}
                                  />
                                ) : (
                                  <div
                                    style={{
                                      color: "red",
                                      fontSize: "14px",
                                      fontStyle: "italic",
                                    }}
                                  >
                                    ⚠️ Video not available
                                  </div>
                                ))}

                              {step.type === "audio" &&
                                (url ? (
                                  <audio
                                    controls
                                    src={url}
                                    style={{ marginTop: "5px", width: "100%" }}
                                  />
                                ) : (
                                  <div
                                    style={{
                                      color: "red",
                                      fontSize: "14px",
                                      fontStyle: "italic",
                                    }}
                                  >
                                    ⚠️ Audio not available
                                  </div>
                                ))}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  {/* Receipts Section (forced dark text) */}
                  <div
                    style={{
                      marginTop: "30px",
                      padding: "20px",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      background: "#f9f9f9",
                      color: "#000",
                    }}
                  >
                    <h3 style={{ marginBottom: "15px", color: "#000" }}>
                      💳 Customer Receipts
                    </h3>

                    {/* Phone Input */}
                    <div style={{ marginBottom: "15px" }}>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Enter phone number e.g. +2347065602624"
                        style={{
                          padding: "10px",
                          width: "100%",
                          borderRadius: "6px",
                          border: "1px solid #ccc",
                          fontSize: "14px",
                          color: "#000",
                        }}
                      />
                    </div>

                    {phone && receipts.length === 0 && (
                      <p style={{ color: "#000" }}>No receipts found for {phone}</p>
                    )}

                    {receipts.map((order) => (
                      <div
                        key={order._id}
                        style={{
                          border: "1px solid #ccc",
                          borderRadius: "8px",
                          padding: "10px",
                          marginBottom: "12px",
                          background: "#fff",
                          color: "#000",
                        }}
                      >
                        <p>
                          <b>Amount:</b> ₦{order.receiptExtract?.paidAmount || "N/A"}
                        </p>
                        <p>
                          <b>Payer Account:</b>{" "}
                          {order.receiptExtract?.payerAccount || "N/A"}
                        </p>
                        <p>
                          <b>Reference:</b>{" "}
                          {order.receiptExtract?.referenceNumber || "N/A"}
                        </p>
                        <p>
                          <b>Date:</b>{" "}
                          {order.receiptExtract?.transactionDate
                            ? new Date(
                                order.receiptExtract.transactionDate
                              ).toLocaleDateString()
                            : "N/A"}
                        </p>
                        <p>
                          <b>Receipt:</b>{" "}
                          {order.receiptUrl ? (
                            <a
                              href={order.receiptUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: "blue" }}
                            >
                              View
                            </a>
                          ) : (
                            "N/A"
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              }
            />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
