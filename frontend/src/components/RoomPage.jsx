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

  const [generatedNotes, setGeneratedNotes] = useState("");
  const [generatedSummary, setGeneratedSummary] = useState("");

  // Capture meeting date & time
  const meetingDateTime = new Date().toLocaleString();

  useEffect(() => {
    const s = io(SOCKET_URL, { transports: ["websocket"] });
    setSocket(s);

    s.on("connect", () => console.log("socket connected", s.id));
    s.on("participants", (p) => setParticipants(p));
    s.on("new_transcript", (t) => setTranscripts((prev) => [...prev, t]));
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
    if (!navigator.mediaDevices?.getUserMedia) return alert("Browser doesn't support audio recording");
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
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive")
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

  // Include participants and date/time in the payload
  const buildPayload = () => ({
    segments: transcripts,
    metadata: {
      meetingDateTime,
      participants: Object.values(participants).map(p => p.userName)
    }
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
    } catch (e) {
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
    } catch (e) {
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
    a.download = `meeting_notes_${meetingDateTime.replace(/[/:, ]/g,'_')}.docx`;
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
    a.download = `summary_${meetingDateTime.replace(/[/:, ]/g,'_')}.docx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: 1000, margin: "16px auto", fontFamily: "sans-serif", padding: 12 }}>
      <h2>Live Room — {roomId}</h2>
      {!joined ? (
        <div>
          <input placeholder="Your display name" value={userName} onChange={(e)=>setUserName(e.target.value)} />
          <button onClick={joinRoom}>Join Room</button>
        </div>
      ) : (
        <div>
          <strong>Joined as:</strong> {userName} <button onClick={leaveRoom}>Leave</button>
        </div>
      )}
      <div style={{ display: "flex", gap: 20 }}>
        <div style={{ flex: 1 }}>
          <h3>Participants</h3>
          <ul>{Object.values(participants).map(p=><li key={p.userId}>{p.userName} {p.userId===userId?"(you)":""}</li>)}</ul>
          <label>
            <input type="checkbox" checked={doDenoise} onChange={(e)=>setDoDenoise(e.target.checked)} /> Apply denoise
          </label>
          <div>
            <button onClick={recording?stopRecording:startRecording} disabled={!joined}>{recording?"Stop Recording":"Start Recording"}</button>
          </div>
          <div style={{ marginTop: 12 }}>
            <button onClick={handleGenerateNotes}>Generate Meeting Notes</button>
            <button onClick={handleGenerateSummary} style={{ marginLeft: 8 }}>Generate Summary</button>
          </div>

          {generatedNotes && (
            <div>
              <h4>Meeting Notes (Tamil)</h4>
              <pre>{generatedNotes}</pre>
              <button onClick={handleDownloadNotes}>Download Notes as DOCX</button>
            </div>
          )}

          {generatedSummary && (
            <div>
              <h4>Summary (Tamil)</h4>
              <pre>{generatedSummary}</pre>
              <button onClick={handleDownloadSummary}>Download Summary as DOCX</button>
            </div>
          )}
        </div>

        <div style={{ flex: 2 }}>
          <h3>Live Transcripts</h3>
          <div style={{ border:"1px solid #ddd", padding:12, height:400, overflowY:"auto" }}>
            {transcripts.map((t,i)=><div key={i}><b>{t.speakerLabel||t.userName}</b>: {t.text}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}
