import React, { useState, useRef } from "react";

export default function AudioRecorder({ onFileReady }) {
  const [recording, setRecording] = useState(false);
  const [fileName, setFileName] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  async function startRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Browser does not support audio recording");
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    mediaRecorderRef.current = mr;
    chunksRef.current = [];
    mr.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const file = new File([blob], `recording_${Date.now()}.webm`, { type: "audio/webm" });
      setFileName(file.name);
      onFileReady(file);
    };
    mr.start();
    setRecording(true);
  }

  function stopRecording() {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  }

  function onFileSelect(e) {
    const f = e.target.files[0];
    if (f) {
      setFileName(f.name);
      onFileReady(f);
    }
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <div>
        <input type="file" accept="audio/*" onChange={onFileSelect} />
      </div>
      <div style={{ marginTop: 8 }}>
        <button onClick={recording ? stopRecording : startRecording}>
          {recording ? "Stop recording" : "Record from mic"}
        </button>
        <span style={{ marginLeft: 8 }}>{fileName || "No file chosen"}</span>
      </div>
    </div>
  );
}
