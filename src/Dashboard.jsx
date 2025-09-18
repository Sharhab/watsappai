import { useState, useEffect } from "react";

function Dashboard() {
  const [tab, setTab] = useState("conversations");
  const [conversations, setConversations] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [failed, setFailed] = useState([]);

  // Load conversations
  useEffect(() => {
    if (tab === "conversations") {
      fetch(`${import.meta.env.VITE_BACKEND}/api/conversations`)
        .then(res => res.json())
        .then(data => setConversations(data.conversations || []));
    }
    if (tab === "analytics") {
      fetch(`${import.meta.env.VITE_BACKEND}/api/conversations`)
        .then(res => res.json())
        .then(data => {
          const counts = {};
          data.conversations.forEach(conv =>
            conv.messages.forEach(msg => {
              if (msg.matchedQA) {
                counts[msg.matchedQA] = (counts[msg.matchedQA] || 0) + 1;
              }
            })
          );
          setAnalytics(counts);
        });
    }
    if (tab === "failed") {
      fetch(`${import.meta.env.VITE_BACKEND}/api/failed-matches`)
        .then(res => res.json())
        .then(data => setFailed(data.failed || []));
    }
  }, [tab]);

  return (
    <div style={{ padding: "20px" }}>
      <h2>🤖 AI Dashboard</h2>

      {/* Tabs */}
      <div style={{ marginBottom: "20px" }}>
        {["conversations", "analytics", "failed"].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              marginRight: "10px",
              padding: "10px 15px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              background: tab === t ? "#007bff" : "#f1f1f1",
              color: tab === t ? "#fff" : "#000",
              cursor: "pointer"
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Conversations Tab */}
      {tab === "conversations" && (
        <div>
          {conversations.map(conv => (
            <div
              key={conv._id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                marginBottom: "20px",
                padding: "15px",
                background: "#fff",
                color: "#000"
              }}
            >
              <h4>📞 {conv.phone}</h4>
              <div>
                {conv.messages.map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      margin: "8px 0",
                      textAlign: msg.sender === "ai" ? "right" : "left"
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        background: msg.sender === "ai" ? "#e0f7fa" : "#f1f1f1",
                        color: "#000"
                      }}
                    >
                      {msg.content}
                      {msg.matchedQA && (
                        <small
                          style={{
                            display: "block",
                            fontSize: "10px",
                            color: "gray"
                          }}
                        >
                          🔎 Matched: {msg.matchedQA} (
                          {Math.round((msg.confidence || 0) * 100)}%)
                        </small>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Analytics Tab */}
      {tab === "analytics" && (
        <div>
          <h3>📊 Top Matched QAs</h3>
          {Object.keys(analytics).length === 0 && <p>No data yet.</p>}
          <ul>
            {Object.entries(analytics).map(([qa, count]) => (
              <li key={qa}>
                {qa} — <b>{count} times</b>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Failed Matches Tab */}
      {tab === "failed" && (
        <div>
          <h3>❌ Failed Matches</h3>
          {failed.length === 0 && <p>No failed matches yet.</p>}
          <ul>
            {failed.map((f, i) => (
              <li key={i}>
                "{f._id}" — <b>{f.count} times</b>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
