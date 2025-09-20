import React, { useEffect, useState } from "react";
import useReceipts from "./order";
import Dashboard from "./Dashboard";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import "./App.css";

const BACKEND_BASE = "https://watsappai2.onrender.com";
const API_URL = `${BACKEND_BASE}/api/qas`;
const INTRO_URL = `${BACKEND_BASE}/api/intro`;

const resolveUrl = (u) => {
  if (!u) return null;
  if (u.startsWith("http")) return u;
  return `${BACKEND_BASE}${u.startsWith("/") ? u : `/${u}`}`;
};

export default function App() {
  const [qas, setQAs] = useState([]);
  const [loading, setLoading] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(true); // sidebar toggle state

  // QA form
  const [question, setQuestion] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [answerAudio, setAnswerAudio] = useState(null);

  // Receipt
  const [phone, setPhone] = useState("");
  const receipts = useReceipts(phone);

  // Intro
  const [sequence, setSequence] = useState([
    { type: "video", file: null }, // 0
    { type: "video", file: null }, // 1
    { type: "audio", file: null }, // 2 (audio #1)
    { type: "audio", file: null }, // 3 (audio #2)
    { type: "text", content: "" }, // 4 (payment text)
    { type: "audio", file: null }, // 5 (closing audio)
  ]);
  const [intro, setIntro] = useState([]);

  // Edit QA state
  const [editId, setEditId] = useState(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswerText, setEditAnswerText] = useState("");
  const [editAnswerAudio, setEditAnswerAudio] = useState(null);
  const [editExistingAudioUrl, setEditExistingAudioUrl] = useState(null);

  // Handlers to keep Intro state writable & files selectable
  const handleFileChange = (index, file) => {
    setSequence((prev) =>
      prev.map((step, i) => (i === index ? { ...step, file } : step))
    );
  };

  const handleTextChange = (index, content) => {
    setSequence((prev) =>
      prev.map((step, i) => (i === index ? { ...step, content } : step))
    );
  };

  // Load Intro
  useEffect(() => {
    fetch(INTRO_URL)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.sequence) setIntro(data.sequence);
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

  // === QA CRUD ===
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

      setQuestion("");
      setAnswerText("");
      setAnswerAudio(null);
    } catch (err) {
      console.error(err);
      alert("Failed to add QA");
    }
  };

  const startEdit = (qa) => {
    setEditId(qa._id);
    setEditQuestion(qa.question || "");
    setEditAnswerText(qa.answerText || "");
    setEditExistingAudioUrl(qa.answerAudio || null);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditQuestion("");
    setEditAnswerText("");
    setEditAnswerAudio(null);
    setEditExistingAudioUrl(null);
  };

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

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this QA?")) return;
    try {
      await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      setQAs((prev) => prev.filter((qa) => qa._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // === Intro Save ===
  const handleSaveIntro = async (e) => {
    e.preventDefault();

    // Validate expected order & presence
    const expected = ["video", "video", "audio", "audio", "text", "audio"];
    const okOrder =
      sequence.length === expected.length &&
      sequence.every((s, i) => s.type === expected[i]);
    if (!okOrder) {
      alert(
        "Intro order must be: 2 videos, 2 audios, 1 text, 1 closing audio. Please fix and try again."
      );
      return;
    }
    if (!sequence[2].file || !sequence[3].file) {
      alert("Two audios before the text are required (steps 3 and 4).");
      return;
    }
    if (!sequence[5].file) {
      alert("Closing audio (last step) is required.");
      return;
    }
    if (!sequence[4].content || !sequence[4].content.trim()) {
      alert("Payment/Text step cannot be empty.");
      return;
    }

    try {
      const formData = new FormData();
      sequence.forEach((step, i) => {
        if (step.type === "text") {
          formData.append(`step${i}_content`, step.content);
        } else if (step.file) {
          formData.append(`step${i}_file`, step.file);
        }
      });
      formData.append("sequence", JSON.stringify(sequence));

      const res = await fetch(`${BACKEND_BASE}/api/intro`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if (data?.intro?.sequence) setIntro(data.intro.sequence);
      alert("Intro sequence saved.");
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to save intro sequence.");
    }
  };

  const handleDeleteIntro = async (index) => {
    if (!window.confirm("Delete this intro step?")) return;
    try {
      await fetch(`${BACKEND_BASE}/api/intro/${index}`, { method: "DELETE" });
      setIntro((prev) => prev.filter((_, i) => i !== index));
    } catch (err) {
      console.error("Delete intro failed:", err);
    }
  };

  return (
    <BrowserRouter>
      <div className="app-container">
         <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
      ☰
    </button>

        {/* Sidebar */}
        <nav className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
          <h2>📋 Menu</h2>
          <ul>
            <li><Link to="/">Q&A Manager</Link></li>
            <li><Link to="/dashboard">Dashboard</Link></li>
          </ul>
        </nav>

        <main className="main-content">
          <Routes>
            <Route
              path="/"
              element={
                <div className="content-wrapper">
                  <h1>Herbal Medicine Q&A Manager</h1>

                  {/* QA Form */}
                  {!editId && (
                    <form onSubmit={handleAddQA} className="form-card">
                      <h3>Add New QA</h3>
                      <input
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="Question"
                        required
                      />
                      <textarea
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        placeholder="Answer"
                      />
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => setAnswerAudio(e.target.files[0])}
                      />
                      <button type="submit" className="btn green">Add QA</button>
                    </form>
                  )}

                  {/* Edit QA */}
                  {editId && (
                    <form onSubmit={handleUpdateQA} className="form-card edit-form">
                      <h3>Edit QA</h3>
                      <input
                        value={editQuestion}
                        onChange={(e) => setEditQuestion(e.target.value)}
                        required
                      />
                      <textarea
                        value={editAnswerText}
                        onChange={(e) => setEditAnswerText(e.target.value)}
                      />
                      {editExistingAudioUrl && (
                        <audio controls src={resolveUrl(editExistingAudioUrl)} />
                      )}
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => setEditAnswerAudio(e.target.files[0])}
                      />
                      <div className="form-actions">
                        <button type="submit" className="btn blue">Save</button>
                        <button type="button" className="btn gray" onClick={cancelEdit}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {/* QA List */}
                  <h2>Saved QAs {loading && "Loading…"}</h2>
                  <ul className="qa-list">
                    {qas.map((qa) => (
                      <li key={qa._id} className="qa-card">
                        <div><b>Q:</b> {qa.question}</div>
                        <div><b>A:</b> {qa.answerText}</div>
                        {qa.answerAudio ? (
                          <audio controls src={resolveUrl(qa.answerAudio)} />
                        ) : (
                          <div className="no-audio">⚠️ No audio</div>
                        )}
                        <div className="qa-actions">
                          <button onClick={() => startEdit(qa)} className="btn blue">Edit</button>
                          <button onClick={() => handleDelete(qa._id)} className="btn red">Delete</button>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {/* Intro Upload */}
                  <form onSubmit={handleSaveIntro} className="form-card">
                    <h3>Upload Intro Sequence</h3>

                    {/* Step 1: Video */}
                    <label>Step 1 (Video)</label>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => handleFileChange(0, e.target.files[0])}
                    />
                    {sequence[0]?.file && <p className="file-note">Selected: {sequence[0].file.name}</p>}

                    {/* Step 2: Video */}
                    <label>Step 2 (Video)</label>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => handleFileChange(1, e.target.files[0])}
                    />
                    {sequence[1]?.file && <p className="file-note">Selected: {sequence[1].file.name}</p>}

                    {/* Step 3: Audio */}
                    <label>Step 3 (Audio)</label>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => handleFileChange(2, e.target.files[0])}
                    />
                    {sequence[2]?.file && <p className="file-note">Selected: {sequence[2].file.name}</p>}

                    {/* Step 4: Audio */}
                    <label>Step 4 (Audio)</label>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => handleFileChange(3, e.target.files[0])}
                    />
                    {sequence[3]?.file && <p className="file-note">Selected: {sequence[3].file.name}</p>}

                    {/* Step 5: Text */}
                    <label>Step 5 (Text / Payment details)</label>
                    <textarea
                      value={sequence[4]?.content || ""}
                      onChange={(e) => handleTextChange(4, e.target.value)}
                      placeholder="Payment details"
                    />

                    {/* Step 6: Closing Audio */}
                    <label>Step 6 (Closing Audio)</label>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => handleFileChange(5, e.target.files[0])}
                    />
                    {sequence[5]?.file && <p className="file-note">Selected: {sequence[5].file.name}</p>}

                    <button type="submit" className="btn green">Save Intro</button>
                  </form>

                  {/* Intro Preview */}
                  <div className="form-card">
                    <h3>📽 Intro Sequence</h3>
                    {intro.length === 0 ? (
                      <p>No intro uploaded yet.</p>
                    ) : (
                      <ul className="qa-list">
                        {intro.map((step, i) => (
                          <li key={i} className="qa-card">
                            <p><b>Step {i + 1}:</b> {step.type}</p>
                            {step.type === "text" && <p>{step.content}</p>}
                            {step.type === "video" && step.fileUrl && (
                              <video controls src={resolveUrl(step.fileUrl)} />
                            )}
                            {step.type === "audio" && step.fileUrl && (
                              <audio controls src={resolveUrl(step.fileUrl)} />
                            )}
                            <div className="qa-actions">
                              <button className="btn red" onClick={() => handleDeleteIntro(i)}>
                                Delete
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Receipts */}
                  <div className="form-card">
                    <h3>💳 Customer Receipts</h3>
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
