// src/App.js
import React, { useEffect, useState } from "react";

const API_URL = "http://localhost:3000/api/qas";

export default function App() {
  const [qas, setQAs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Create form state
  const [question, setQuestion] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [answerAudio, setAnswerAudio] = useState(null); // File

 // Example initial state (empty placeholders)
const [sequence, setSequence] = useState([
  { type: "video", file: null },  // step 0
  { type: "video", file: null },  // step 1
  { type: "audio", file: null },  // step 2
  { type: "audio", file: null },  // step 3
  { type: "text", content: "" },  // step 4
  { type: "audio", file: null },  // step 5
]);

  // Edit form state
  const [editId, setEditId] = useState(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswerText, setEditAnswerText] = useState("");
  const [editAnswerAudio, setEditAnswerAudio] = useState(null); // File
  const [editExistingAudioUrl, setEditExistingAudioUrl] = useState(null);

  const [intro, setIntro] = useState([]);

useEffect(() => {
  fetch("http://localhost:3000/api/intro")
    .then((res) => res.json())
    .then((data) => {
      if (data && data.sequence) {
        setIntro(data.sequence); // 🔥 use the sequence array directly
      } else {
        console.error("Unexpected intro format:", data);
        setIntro([]); // fallback to empty
      }
    })
    .catch((err) => {
      console.error("Error loading intro:", err);
    });
}, []);


  // Load all QAs
  useEffect(() => {
    setLoading(true);
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => setQAs(data))
      .catch((err) => console.error("Error loading QAs:", err))
      .finally(() => setLoading(false));
  }, []);

  // Add QA
  const handleAddQA = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append("question", question);
      formData.append("answerText", answerText);
      if (answerAudio) {
        formData.append("answerAudio", answerAudio);
      }

      const res = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to create QA");

      const newQA = await res.json();
      setQAs((prev) => [...prev, newQA]);

      // reset form
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

// Save Intro Message
// inside your App.jsx (or wherever you handle upload)
const handleSaveIntro = async (e) => {
  e.preventDefault();
  try {
    const formData = new FormData();

    // Loop through sequence correctly
    sequence.forEach((step, i) => {
      if (step.type === "text") {
        formData.append(`step${i}_content`, step.content);
      } else if (step.file) {
        formData.append(`step${i}_file`, step.file);
      }
    });

    // ✅ ALSO send metadata JSON (so backend doesn’t break)
    formData.append(
      "sequence",
      JSON.stringify(
        sequence.map((s) => ({
          type: s.type,
          content: s.content || null,
        }))
      )
    );

    const res = await fetch("http://localhost:3000/api/intro", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error(await res.text());
    }

    const data = await res.json();
    console.log("✅ Upload successful:", data);
  } catch (err) {
    console.error("❌ Upload failed:", err);
  }
};

// When file is chosen (video/audio)
const handleFileChange = (index, file) => {
  setSequence((prev) => {
    const updated = [...prev];
    updated[index].file = file;
    return updated;
  });
};

// When text is typed
const handleTextChange = (index, value) => {
  setSequence((prev) => {
    const updated = [...prev];
    updated[index].content = value;
    return updated;
  });
};

//--Handledelete------
 const handleDeleteIntroStep = async (index) => {
    await fetch(`${API_URL}/intro/${index}`, { method: "DELETE" });
    setIntroSequence(introSequence.filter((_, i) => i !== index));
  };

  // Update QA
  const handleUpdateQA = async (e) => {
    e.preventDefault();
    if (!editId) return;

    try {
      const formData = new FormData();
      formData.append("question", editQuestion);
      formData.append("answerText", editAnswerText);
      // Only append a new audio file if user selected one
      if (editAnswerAudio) {
        formData.append("answerAudio", editAnswerAudio);
      }

      const res = await fetch(`${API_URL}/${editId}`, {
        method: "PUT",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to update QA");

      const updated = await res.json();
      setQAs((prev) => prev.map((q) => (q._id === editId ? updated : q)));

      // reset edit state
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

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        padding: "20px",
        maxWidth: "900px",
        margin: "auto",
      }}
    >
      <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
        Herbal Medicine Q&A Manager
      </h1>

      {/* CREATE FORM */}
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
          onChange={(e) => setAnswerAudio(e.target.files[0] || null)}
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

      {/* EDIT FORM */}
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
                  src={`http://localhost:3000${editExistingAudioUrl}`}
                  style={{ display: "block", marginTop: "6px" }}
                />
              ) : (
                <span style={{ marginLeft: 6, color: "#888" }}>None</span>
              )}
            </div>
            <label>
              Replace audio (optional):
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => setEditAnswerAudio(e.target.files[0] || null)}
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

      {/* LIST */}
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
          <span style={{ fontSize: 12, color: "#777" }}>&nbsp;Loading…</span>
        )}
      </div>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {qas.map((qa) => (
          <li
            key={qa._id}
            style={{
              marginBottom: "15px",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "8px",
            }}
          >
            <div style={{ marginBottom: 6 }}>
              <strong>Q:</strong> {qa.question}
            </div>
            <div style={{ marginBottom: 6 }}>
              <strong>A:</strong> {qa.answerText || <em>(no text)</em>}
            </div>

            {qa.answerAudio && (
              <div style={{ marginTop: 6 }}>
                <audio
                  controls
                  src={`http://localhost:3000${qa.answerAudio}`}
                />
              </div>
            )}

            <div style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
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
{/* Intro Form */}
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
    background: "#333"
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
    />
  </label>

  <label>
    Video 2:
    <input
      type="file"
      accept="video/*"
      onChange={(e) => handleFileChange(1, e.target.files[0])}
      required
    />
  </label>

  <label>
    Audio 1:
    <input
      type="file"
      accept="audio/*"
      onChange={(e) => handleFileChange(2, e.target.files[0])}
      required
    />
  </label>

  <label>
    Audio 2:
    <input
      type="file"
      accept="audio/*"
      onChange={(e) => handleFileChange(3, e.target.files[0])}
      required
    />
  </label>

  <label>
    Payment Text:
    <textarea
      placeholder="Enter payment details"
      value={sequence[4]?.content || ""}
      onChange={(e) => handleTextChange(4, e.target.value)}
      required
      style={{ width: "100%", minHeight: "80px", padding: "8px" }}
    />
  </label>

  <label>
    Closing Audio:
    <input
      type="file"
      accept="audio/*"
      onChange={(e) => handleFileChange(5, e.target.files[0])}
      required
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
      fontWeight: "bold"
    }}
  >
    Save Intro
  </button>
</form>

{/* Intro Preview */}
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
    {intro.map((step, i) => (
      <li
        key={i}
        style={{
          border: "1px solid #ccc",
          borderRadius: "8px",
          padding: "10px",
          background: "#444",
          color: "white",
          marginBottom: "12px"
        }}
      >
        <p style={{ fontWeight: "bold", marginBottom: "8px" }}>
          Step {i + 1}: {step.type}
        </p>

        {step.type === "text" && (
          <p style={{ margin: 0 }}>{step.content}</p>
        )}

        {step.type === "video" && step.fileUrl && (
          <video
            controls
            src={`http://localhost:3000${step.fileUrl}`}
            style={{ width: "250px", borderRadius: "8px" }}
          />
        )}

        {step.type === "audio" && step.fileUrl && (
          <audio
            controls
            src={`http://localhost:3000${step.fileUrl}`}
            style={{ marginTop: "5px" }}
          />
        )}
      </li>
    ))}
  </ul>
)}

  
</div>



    </div>
  );
}
