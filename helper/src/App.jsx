import { useMemo, useState } from "react";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";

const defaultDistanceForm = {
  from_lat: "28.6139",
  from_lng: "77.2090",
  to_lat: "28.5355",
  to_lng: "77.3910",
};

function App() {
  const [message, setMessage] = useState("");
  const [chatReply, setChatReply] = useState("");
  const [insights, setInsights] = useState(null);
  const [distanceForm, setDistanceForm] = useState(defaultDistanceForm);
  const [distanceResult, setDistanceResult] = useState(null);
  const [loadingChat, setLoadingChat] = useState(false);
  const [loadingDistance, setLoadingDistance] = useState(false);

  const canAsk = useMemo(() => message.trim().length > 0, [message]);

  const askChatbot = async () => {
    if (!canAsk) return;
    setLoadingChat(true);
    try {
      const response = await fetch(`${API_BASE}/api/chat/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      });

      const data = await response.json();
      setChatReply(data.reply || "No reply received.");
      setInsights(data.insights || null);
    } catch (error) {
      setChatReply("Could not connect to backend. Please start FastAPI server.");
      setInsights(null);
    } finally {
      setLoadingChat(false);
    }
  };

  const estimateDistance = async () => {
    setLoadingDistance(true);
    try {
      const payload = Object.fromEntries(
        Object.entries(distanceForm).map(([key, value]) => [key, Number(value)])
      );

      const response = await fetch(`${API_BASE}/api/distance/estimate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      setDistanceResult(data);
    } catch (error) {
      setDistanceResult({ error: "Could not estimate distance. Is backend running?" });
    } finally {
      setLoadingDistance(false);
    }
  };

  return (
    <div className="page">
      <main className="container">
        <h1>Mood Analyzer + Distance Tracker ChatBot</h1>
        <p className="subtitle">Helper UI for chat-based mood insights and route distance estimates.</p>

        <section className="card">
          <h2>Mood Chat</h2>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="How are you feeling today?"
            rows={4}
          />
          <button onClick={askChatbot} disabled={!canAsk || loadingChat}>
            {loadingChat ? "Analyzing..." : "Ask ChatBot"}
          </button>

          {chatReply ? <p className="reply">{chatReply}</p> : null}
          {insights ? (
            <div className="insights">
              <strong>Mood:</strong> {insights.mood} | <strong>Confidence:</strong>{" "}
              {(insights.confidence * 100).toFixed(0)}%
              <br />
              <strong>Tip:</strong> {insights.supportive_tip}
            </div>
          ) : null}
        </section>

        <section className="card">
          <h2>Distance Estimator</h2>
          <div className="grid">
            {Object.keys(distanceForm).map((field) => (
              <label key={field}>
                {field}
                <input
                  value={distanceForm[field]}
                  onChange={(event) =>
                    setDistanceForm((prev) => ({ ...prev, [field]: event.target.value }))
                  }
                />
              </label>
            ))}
          </div>

          <button onClick={estimateDistance} disabled={loadingDistance}>
            {loadingDistance ? "Calculating..." : "Estimate Distance"}
          </button>

          {distanceResult?.error ? <p className="error">{distanceResult.error}</p> : null}
          {distanceResult?.distance_km ? (
            <p className="result">
              Distance: {distanceResult.distance_km} km | ETA: {distanceResult.eta_minutes} mins
            </p>
          ) : null}
        </section>
      </main>
    </div>
  );
}

export default App;
