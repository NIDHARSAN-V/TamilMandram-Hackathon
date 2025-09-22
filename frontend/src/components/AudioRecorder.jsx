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
      const file = new File([blob], `recording_${Date.now()}.webm`, {
        type: "audio/webm",
      });
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
    <div
      style={{
        marginBottom: 20,
        padding: 20,
        borderRadius: 20,
        background: "linear-gradient(135deg, #6e8efb, #a777e3)",
        boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
        color: "white",
        textAlign: "center",
        fontFamily: "Arial, sans-serif",
        transition: "all 0.3s ease-in-out",
      }}
    >
      <h2
        style={{
          marginBottom: 15,
          fontSize: 22,
          letterSpacing: "1px",
          textShadow: "1px 1px 4px rgba(0,0,0,0.4)",
        }}
      >
        🎙️ Audio Recorder
      </h2>

      <div style={{ marginBottom: 15 }}>
        <input
          type="file"
          accept="audio/*"
          onChange={onFileSelect}
          style={{
            padding: "8px 12px",
            borderRadius: 12,
            border: "2px dashed rgba(255,255,255,0.7)",
            background: "rgba(255,255,255,0.1)",
            color: "white",
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
        />
      </div>

      <div>
        <button
          onClick={recording ? stopRecording : startRecording}
          style={{
            padding: "12px 24px",
            borderRadius: 25,
            border: "none",
            fontSize: 16,
            fontWeight: "bold",
            color: "white",
            cursor: "pointer",
            background: recording
              ? "linear-gradient(135deg, #ff4e50, #f9d423)"
              : "linear-gradient(135deg, #42e695, #3bb2b8)",
            boxShadow: "0 6px 15px rgba(0,0,0,0.2)",
            transform: recording ? "scale(1.1)" : "scale(1)",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) =>
            (e.target.style.transform = "scale(1.1) translateY(-3px)")
          }
          onMouseLeave={(e) =>
            (e.target.style.transform = recording ? "scale(1.1)" : "scale(1)")
          }
        >
          {recording ? "⏹ Stop Recording" : "🎤 Start Recording"}
        </button>

        <div
          style={{
            marginTop: 15,
            fontSize: 14,
            opacity: 0.9,
            fontStyle: "italic",
            transition: "all 0.3s ease-in-out",
          }}
        >
          {fileName ? `✅ ${fileName}` : "No file chosen yet"}
        </div>
      </div>
    </div>
  );
}
