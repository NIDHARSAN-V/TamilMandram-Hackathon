import React, { useState } from "react";
import AudioRecorder from "./AudioRecorder";
import Editor from "./Editor";
import { postTranscribeForm } from "../api";

export default function Recorder() {
  const [audioFile, setAudioFile] = useState(null);
  const [segments, setSegments] = useState(null);
  const [loading, setLoading] = useState(false);
  const [doDiarize, setDoDiarize] = useState(false);
  const [doDenoise, setDoDenoise] = useState(true);
  const [language, setLanguage] = useState("ta"); // default Tamil

  async function handleTranscribe() {
    if (!audioFile) {
      alert("Choose or record an audio file first.");
      return;
    }
    setLoading(true);
    const form = new FormData();
    form.append("audio", audioFile);
    form.append("do_diarize", doDiarize ? "true" : "false");
    form.append("do_denoise", doDenoise ? "true" : "false");
    form.append("language", language); // send selected language to backend

    try {
      const res = await postTranscribeForm(form);
      const data = res.data;
      setSegments(data.segments || []);
    } catch (err) {
      console.error(err);
      alert("Transcription failed. See console.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "32px auto",
        fontFamily: "Segoe UI, sans-serif",
        padding: 24,
        background: "linear-gradient(135deg, #fdfbfb, #ebedee)",
        borderRadius: 16,
        boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
        transition: "all 0.3s ease-in-out",
      }}
    >
      <h1
        style={{
          fontSize: 28,
          marginBottom: 20,
          textAlign: "center",
          background: "linear-gradient(135deg, #6e8efb, #a777e3)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        🎧 Audio → Word (.docx)
      </h1>

      {!segments ? (
        <div>
          {/* File Recorder */}
          <AudioRecorder onFileReady={(f) => setAudioFile(f)} />

          {/* Options */}
          <div style={{ marginTop: 14 }}>
            {/* Language Selector */}
            <label style={{ display: "block", marginBottom: 8, fontSize: 15 }}>
              Select Language:
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{ marginLeft: 8, padding: 4, fontSize: 15 }}
              >
                <option value="ta">Tamil 🇮🇳</option>
                <option value="en">English 🇺🇸</option>
                <option value="hi">Hindi 🇮🇳</option>
                <option value="other">Other</option>
              </select>
            </label>

            <label
              style={{
                display: "block",
                marginBottom: 8,
                cursor: "pointer",
                fontSize: 15,
              }}
            >
              <input
                type="checkbox"
                checked={doDenoise}
                onChange={(e) => setDoDenoise(e.target.checked)}
                style={{ marginRight: 8 }}
              />
              Apply basic denoise
            </label>

            <label
              style={{
                display: "block",
                marginBottom: 8,
                cursor: "pointer",
                fontSize: 15,
              }}
            >
              <input
                type="checkbox"
                checked={doDiarize}
                onChange={(e) => setDoDiarize(e.target.checked)}
                style={{ marginRight: 8 }}
              />
              Attempt speaker diarization (server must support)
            </label>
          </div>

          {/* Transcribe Button */}
          <div style={{ marginTop: 18, textAlign: "center" }}>
            <button
              onClick={handleTranscribe}
              disabled={loading}
              style={{
                padding: "12px 28px",
                borderRadius: 30,
                border: "none",
                cursor: "pointer",
                background: loading
                  ? "linear-gradient(135deg, #ff4e50, #f9d423)"
                  : "linear-gradient(135deg, #42e695, #3bb2b8)",
                color: "white",
                fontSize: 16,
                fontWeight: "bold",
                boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
                transform: loading ? "scale(1.05)" : "scale(1)",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) =>
                (e.target.style.transform = "scale(1.08) translateY(-2px)")
              }
              onMouseLeave={(e) =>
                (e.target.style.transform = loading ? "scale(1.05)" : "scale(1)")
              }
            >
              {loading ? "⏳ Transcribing..." : "📝 Transcribe & Edit"}
            </button>
          </div>

          {/* Note */}
          <div
            style={{
              marginTop: 16,
              fontSize: 14,
              color: "#555",
              textAlign: "center",
            }}
          >
            <strong>Note:</strong> After transcription you can{" "}
            <span style={{ color: "#6e8efb", fontWeight: 600 }}>
              edit text
            </span>{" "}
            and export as a <code>.docx</code>.
          </div>
        </div>
      ) : (
        <Editor segments={segments} onBack={() => setSegments(null)} />
      )}
    </div>
  );
}
