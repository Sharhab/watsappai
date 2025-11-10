import React, { useState, useEffect } from "react";
import { BACKEND_BASE, tenantFetch } from "./api";

const INTRO_URL = `${BACKEND_BASE}/api/intro`;

const resolveUrl = (u) => {
  if (!u) return null;
  if (u.startsWith("http")) return u;
  return `${BACKEND_BASE}${u.startsWith("/") ? u : `/${u}`}`;
};

export default function IntroManager() {
  const [sequence, setSequence] = useState([
    { type: "video", file: null }, // 0
    { type: "video", file: null }, // 1
    { type: "audio", file: null }, // 2
    { type: "audio", file: null }, // 3
    { type: "text", content: "" }, // 4
    { type: "audio", file: null }, // 5
  ]);
  const [intro, setIntro] = useState([]);

  // Load Intro
  useEffect(() => {
     tenantFetch(INTRO_URL)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.sequence) setIntro(data.sequence);
      })
      .catch((err) => console.error("Error loading intro:", err));
  }, []);

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

const handleSaveIntro = async (e) => {
  e.preventDefault();

  const expected = ["video", "video", "audio", "audio", "text", "audio"];
  const okOrder =
    sequence.length === expected.length &&
    sequence.every((s, i) => s.type === expected[i]);

  if (!okOrder) {
    alert("Order must be: 2 videos, 2 audios, 1 text, 1 closing audio");
    return;
  }

  const token = localStorage.getItem("token");
const tenantId = localStorage.getItem("tenant");
  if (!token || !tenantId) {
    alert("Missing authentication — please log in again.");
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

    const res = await fetch(INTRO_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "x-tenant-id": tenantId,
      },
      body: formData,
    });

    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();

    if (data?.intro?.sequence) setIntro(data.intro.sequence);
    alert("✅ Intro saved successfully!");
  } catch (err) {
    console.error("❌ Upload failed:", err);
    alert("Failed to save intro.");
  }
};

  const handleDeleteIntro = async (index) => {
    if (!window.confirm("Delete this intro step?")) return;
    try {
      await fetch(`${INTRO_URL}/${index}`, { method: "DELETE" });
      setIntro((prev) => prev.filter((_, i) => i !== index));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <div className="content-wrapper">
      <h1>🎬 Intro Manager</h1>

      <form onSubmit={handleSaveIntro} className="form-card">
        <h3>Upload Intro Sequence</h3>

        {["Video", "Video", "Audio", "Audio", "Text", "Closing Audio"].map(
          (label, idx) => (
            <div key={idx}>
              <label>{`Step ${idx + 1} (${label})`}</label>
              {label === "Text" ? (
                <textarea
                  value={sequence[idx]?.content || ""}
                  onChange={(e) => handleTextChange(idx, e.target.value)}
                  placeholder="Payment / Details"
                />
              ) : (
                <input
                  type="file"
                  accept={label.includes("Video") ? "video/*" : "audio/*"}
                  onChange={(e) => handleFileChange(idx, e.target.files[0])}
                />
              )}
              {sequence[idx]?.file && (
                <p className="file-note">Selected: {sequence[idx].file.name}</p>
              )}
            </div>
          )
        )}
        <button type="submit" className="btn green">Save Intro</button>
      </form>

      <div className="form-card">
        <h3>📽 Current Intro Sequence</h3>
        {intro.length === 0 ? (
          <p>No intro uploaded yet.</p>
        ) : (
          <ul className="qa-list">
            {intro.map((step, i) => (
              <li key={i} className="qa-card">
                <p><b>Step {i + 1}:</b> {step.type}</p>
                {step.type === "text" && <p>{step.content}</p>}
                {step.type === "video" && step.fileUrl && (
                  <video controls src={resolveUrl(step.fileUrl)} width="250" />
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
    </div>
  );
}
