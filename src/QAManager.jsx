import React, { useEffect, useState } from "react";
import { BACKEND_BASE, tenantFetch } from "./api";

const API_URL = `${BACKEND_BASE}/api/qas`;

export default function QAManager() {
  const [qas, setQAs] = useState([]);
  const [loading, setLoading] = useState(false);

  const [question, setQuestion] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [answerAudio, setAnswerAudio] = useState(null);

  const [editId, setEditId] = useState(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswerText, setEditAnswerText] = useState("");
  const [editAnswerAudio, setEditAnswerAudio] = useState(null);

  // Load QAs
  useEffect(() => {
    setLoading(true);
    tenantFetch(API_URL)
      .then((res) => res.json())
      .then((data) => setQAs(data || []))
      .catch((err) => console.error("Error loading QAs:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleAddQA = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("question", question);
      formData.append("answerText", answerText);
      if (answerAudio) formData.append("answerAudio", answerAudio);

      const res = await tenantFetch(API_URL, { method: "POST", body: formData });
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

  const handleUpdateQA = async (e) => {
    e.preventDefault();
    if (!editId) return;
    try {
      const formData = new FormData();
      formData.append("question", editQuestion);
      formData.append("answerText", editAnswerText);
      if (editAnswerAudio) formData.append("answerAudio", editAnswerAudio);

      const res = await tenantFetch(`${API_URL}/${editId}`, {
        method: "PUT",
        body: formData,
      });
      const updated = await res.json();
      setQAs((prev) => prev.map((q) => (q._id === editId ? updated : q)));
      setEditId(null);
    } catch (err) {
      console.error(err);
      alert("Failed to update QA");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this QA?")) return;
    try {
      await tenantFetch(`${API_URL}/${id}`, { method: "DELETE" });
      setQAs((prev) => prev.filter((qa) => qa._id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <div className="content-wrapper">
      <h1>Herbal Medicine Q&A Manager</h1>
      {/* Add QA form */}
      {!editId && (
        <form onSubmit={handleAddQA} className="form-card">
          <h3>Add New QA</h3>
          <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Question" required />
          <textarea value={answerText} onChange={(e) => setAnswerText(e.target.value)} placeholder="Answer" />
          <input type="file" accept="audio/*" onChange={(e) => setAnswerAudio(e.target.files[0])} />
          <button type="submit" className="btn green">Add QA</button>
        </form>
      )}
      {/* Edit QA form */}
      {editId && (
        <form onSubmit={handleUpdateQA} className="form-card edit-form">
          <h3>Edit QA</h3>
          <input value={editQuestion} onChange={(e) => setEditQuestion(e.target.value)} required />
          <textarea value={editAnswerText} onChange={(e) => setEditAnswerText(e.target.value)} />
          <input type="file" accept="audio/*" onChange={(e) => setEditAnswerAudio(e.target.files[0])} />
          <div className="form-actions">
            <button type="submit" className="btn blue">Save</button>
            <button type="button" className="btn gray" onClick={() => setEditId(null)}>Cancel</button>
          </div>
        </form>
      )}
      {/* QA List */}
      <h2>Saved QAs {loading && "Loading…"}</h2>
      <ul className="qa-list">
       {Array.isArray(qas) && qas.length > 0 ? (
    qas.map((qa) => (
      <li key={qa._id} className="qa-card">
        <div><b>Q:</b> {qa.question}</div>
        <div><b>A:</b> {qa.answerText}</div>
        
        {qa.answerAudio ? (
          <audio controls src={qa.answerAudio} />
        ) : (
          <div className="no-audio">⚠️ No audio</div>
        )}

        <div className="qa-actions">
          <button
            onClick={() => {
              setEditId(qa._id);
              setEditQuestion(qa.question);
              setEditAnswerText(qa.answerText);
            }}
            className="btn blue"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(qa._id)}
            className="btn red"
          >
            Delete
          </button>
        </div>
      </li>
    ))
  ) : (
    <li className="qa-empty">No QAs available</li>
  )}
      </ul>
    </div>
  );
}
