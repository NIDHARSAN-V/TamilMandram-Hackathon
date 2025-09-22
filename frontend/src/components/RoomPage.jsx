import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";

const SOCKET_URL = "http://localhost:4000";
const API_URL = "http://localhost:8001";

export default function RoomPage({ roomIdProp }) {
  const [socket, setSocket] = useState(null);
  const [joined, setJoined] = useState(false);
  const [userName, setUserName] = useState("");
  const [userId] = useState(() => uuidv4());
  const [participants, setParticipants] = useState({});
  const [transcripts, setTranscripts] = useState([]);
  const mediaRecorderRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [doDenoise, setDoDenoise] = useState(true);
  const roomId = roomIdProp || "default-room";
  const [language, setLanguage] = useState("ta"); // "ta" for Tamil, "en" for English


  const [generatedNotes, setGeneratedNotes] = useState("");
  const [generatedSummary, setGeneratedSummary] = useState("");

  const meetingDateTime = new Date().toLocaleString();

  useEffect(() => {
    const s = io(SOCKET_URL, { transports: ["websocket"] });
    setSocket(s);

    s.on("connect", () => console.log("socket connected", s.id));
    s.on("participants", (p) => setParticipants(p));
    s.on("new_transcript", (t) =>
      setTranscripts((prev) => [...prev, { ...t, id: Date.now() }])
    );
    s.on("participant_joined", (p) =>
      setParticipants((prev) => ({ ...prev, [p.userId]: p }))
    );
    s.on("participant_left", (p) => {
      const cp = { ...participants };
      delete cp[p.userId];
      setParticipants(cp);
    });

    return () => s.disconnect();
  }, []);

  const joinRoom = () => {
    if (!socket) return;
    if (!userName) return alert("Choose a display name first.");
    socket.emit("join", { roomId, userId, userName });
    setJoined(true);
  };

  const leaveRoom = () => {
    if (!socket) return;
    socket.emit("leave", { roomId, userId });
    setJoined(false);
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia)
      return alert("Browser doesn't support audio recording");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream, { mimeType: "audio/webm; codecs=opus" });
    mediaRecorderRef.current = mr;

    mr.ondataavailable = async (ev) => {
      if (ev.data.size > 0) await sendBlobToServer(ev.data);
    };

    mr.start(3000);
    setRecording(true);
    mr.onstop = () => {
      setRecording(false);
      mr.stream.getTracks().forEach((t) => t.stop());
    };
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    )
      mediaRecorderRef.current.stop();
  };

  const sendBlobToServer = async (blob) => {
    if (!socket) return;
    const ab = await blob.arrayBuffer();
    const metadata = {
      roomId,
      userId,
      userName,
      filename: `segment_${Date.now()}.webm`,
      doDenoise: !!doDenoise,
    };
    socket.emit("audio_blob", metadata, ab);
  };

  const buildPayload = () => ({
    segments: transcripts,
    language,
    metadata: {
      meetingDateTime,
      participants: Object.values(participants).map((p) => p.userName),
    },
  });

  const handleGenerateNotes = async () => {
    try {
      const resp = await fetch(`${API_URL}/api/min_meet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const data = await resp.json();
      setGeneratedNotes(data.notes);
    } catch {
      alert("Failed to generate notes");
    }
  };

  const handleGenerateSummary = async () => {
    try {
      const resp = await fetch(`${API_URL}/api/summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const data = await resp.json();
      setGeneratedSummary(data.summary);
    } catch {
      alert("Failed to generate summary");
    }
  };

  const handleDownloadNotes = async () => {
    const resp = await fetch(`${API_URL}/api/download_notes_docx`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload()),
    });
    const blob = await resp.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `meeting_notes_${meetingDateTime.replace(/[/:, ]/g, "_")}.docx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadSummary = async () => {
    const resp = await fetch(`${API_URL}/api/download_summary_docx`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload()),
    });
    const blob = await resp.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `summary_${meetingDateTime.replace(/[/:, ]/g, "_")}.docx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // ✅ New function to download live transcripts
  const handleDownloadTranscripts = async () => {
    try {
      const resp = await fetch(`${API_URL}/api/download_transcripts_docx`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transcripts_${meetingDateTime.replace(/[/:, ]/g, "_")}.docx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Failed to download transcripts");
    }
  };

  return (
    <div
      style={{
        maxWidth: 1000,
        margin: "24px auto",
        fontFamily: "Segoe UI, sans-serif",
        padding: 20,
        borderRadius: 16,
        background: "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(10px)",
        boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
        animation: "fadeIn 1s ease",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          color: "#333",
          marginBottom: 20,
          fontSize: 28,
          fontWeight: 700,
        }}
      >
        Live Room — {roomId}
      </h2>

      {!joined ? (
        <div style={{ textAlign: "center" }}>
          <input
            placeholder="Your display name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #ccc",
              marginRight: 10,
              outline: "none",
              transition: "0.3s",
            }}
          />
          <button
            onClick={joinRoom}
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              border: "none",
              background: "#4CAF50",
              color: "#fff",
              cursor: "pointer",
              transition: "0.3s",
            }}
          >
            Join Room
          </button>
        </div>
      ) : (
        <div style={{ marginBottom: 20, textAlign: "center" }}>
          <strong>Joined as:</strong> {userName}{" "}
          <button
            onClick={leaveRoom}
            style={{
              marginLeft: 10,
              padding: "6px 12px",
              borderRadius: 6,
              border: "none",
              background: "#f44336",
              color: "#fff",
              cursor: "pointer",
              transition: "0.3s",
            }}
          >
            Leave
          </button>
        </div>
      )}

      <div style={{ display: "flex", gap: 20, marginTop: 20 }}>
        {/* Left Panel */}
        <div
          style={{
            flex: 1,
            padding: 16,
            borderRadius: 12,
            background: "#fafafa",
            boxShadow: "inset 0 2px 6px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ marginBottom: 10 }}>Participants</h3>
          <ul style={{ marginBottom: 10 }}>
            {Object.values(participants).map((p) => (
              <li
                key={p.userId}
                style={{
                  padding: "6px 0",
                  transition: "0.3s",
                  fontWeight: p.userId === userId ? "bold" : "normal",
                }}
              >
                {p.userName} {p.userId === userId ? "(you)" : ""}
              </li>
            ))}
          </ul>
          {joined && (
            <>
              <label style={{ display: "block", margin: "10px 0" }}>
                <input
                  type="checkbox"
                  checked={doDenoise}
                  onChange={(e) => setDoDenoise(e.target.checked)}
                />{" "}
                Apply denoise
              </label>
              <div>
                <button
                  onClick={recording ? stopRecording : startRecording}
                  disabled={!joined}
                  style={{
                    padding: "10px 16px",
                    borderRadius: 8,
                    border: "none",
                    background: recording ? "#f44336" : "#2196F3",
                    color: "#fff",
                    cursor: "pointer",
                    marginBottom: 12,
                    transition: "0.3s",
                  }}
                >
                  {recording ? "Stop Recording" : "Start Recording"}
                </button>
              </div>
            </>
          )}

          {/* Show buttons after leaving or anytime */}
          {transcripts.length > 0 && (
            <div style={{ marginTop: 20, textAlign: "center" }}>
              <button
                onClick={handleDownloadTranscripts}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: "#FF5722",
                  color: "#fff",
                  cursor: "pointer",
                  transition: "0.3s",
                  marginBottom: 8,
                }}
              >
                Download Transcripts as DOCX
              </button>

              <label>
  Select Language:{" "}
  <select
    value={language}
    onChange={(e) => setLanguage(e.target.value)}
    style={{ marginBottom: 12, padding: "6px 8px", borderRadius: 6 }}
  >
    <option value="ta">Tamil</option>
    <option value="en">English</option>
  </select>
</label>

              {!joined && (
                <>
                  <button
                    onClick={handleGenerateNotes}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 8,
                      border: "none",
                      background: "#673AB7",
                      color: "#fff",
                      cursor: "pointer",
                      marginRight: 8,
                      transition: "0.3s",
                    }}
                  >
                    Generate Meeting Notes
                  </button>
                  <button
                    onClick={handleGenerateSummary}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 8,
                      border: "none",
                      background: "#009688",
                      color: "#fff",
                      cursor: "pointer",
                      transition: "0.3s",
                    }}
                  >
                    Generate Summary
                  </button>
                </>
              )}
            </div>
          )}

          {!joined && generatedNotes && (
            <div style={{ marginTop: 20 }}>
              <h4>Meeting Notes (Tamil)</h4>
              <pre
                style={{
                  background: "#eee",
                  padding: 10,
                  borderRadius: 8,
                  maxHeight: 200,
                  overflow: "auto",
                }}
              >
                {generatedNotes}
              </pre>
              <button
                onClick={handleDownloadNotes}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "none",
                  background: "#4CAF50",
                  color: "#fff",
                  cursor: "pointer",
                  marginTop: 8,
                }}
              >
                Download Notes as DOCX
              </button>
            </div>
          )}

          {!joined && generatedSummary && (
            <div style={{ marginTop: 20 }}>
              <h4>Summary (Tamil)</h4>
              <pre
                style={{
                  background: "#eee",
                  padding: 10,
                  borderRadius: 8,
                  maxHeight: 200,
                  overflow: "auto",
                }}
              >
                {generatedSummary}
              </pre>
              <button
                onClick={handleDownloadSummary}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "none",
                  background: "#FF9800",
                  color: "#fff",
                  cursor: "pointer",
                  marginTop: 8,
                }}
              >
                Download Summary as DOCX
              </button>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div
          style={{
            flex: 2,
            padding: 16,
            borderRadius: 12,
            background: "#fafafa",
            boxShadow: "inset 0 2px 6px rgba(0,0,0,0.05)",
          }}
        >
          <h3>Live Transcripts</h3>
          <div
            style={{
              border: "1px solid #ddd",
              padding: 12,
              height: 400,
              overflowY: "auto",
              borderRadius: 8,
              background: "#fff",
              transition: "all 0.3s ease-in-out",
            }}
          >
            {transcripts.map((t, i) => (
              <div
                key={t.id || i}
                style={{
                  marginBottom: 6,
                  padding: "6px 8px",
                  borderRadius: 6,
                  background: "rgba(0, 150, 136, 0.05)",
                  animation: "fadeInUp 0.5s ease",
                }}
              >
                <b>{t.speakerLabel || t.userName}</b>: {t.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
}
