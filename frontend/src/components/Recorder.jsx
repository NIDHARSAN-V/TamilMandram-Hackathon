import React, { useState } from "react";
import AudioRecorder from "./AudioRecorder";
import Editor from "./Editor";
import { postTranscribeForm } from "../api";
import axios from "axios";

export default function Recorder() {
  const [audioFile, setAudioFile] = useState(null);
  const [segments, setSegments] = useState(null);
  const [loading, setLoading] = useState(false);
  const [doDiarize, setDoDiarize] = useState(false);
  const [doDenoise, setDoDenoise] = useState(true);

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
    try {
      const res = await postTranscribeForm(form, (p) => {
        // optional progress UI
      });
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
    <div style={{ maxWidth: 900, margin: "24px auto", fontFamily: "sans-serif", padding: 12 }}>
      <h1>தமிழ் ஆடியோ → Word (.docx)</h1>
      {!segments ? (
        <div>
          <AudioRecorder onFileReady={(f) => setAudioFile(f)} />
          <div style={{ marginTop: 10 }}>
            <label><input type="checkbox" checked={doDenoise} onChange={(e)=>setDoDenoise(e.target.checked)} /> Apply basic denoise</label>
          </div>
          <div style={{ marginTop: 6 }}>
            <label><input type="checkbox" checked={doDiarize} onChange={(e)=>setDoDiarize(e.target.checked)} /> Attempt speaker diarization (server must support)</label>
          </div>
          <div style={{ marginTop: 12 }}>
            <button onClick={handleTranscribe} disabled={loading}>{loading ? "Transcribing..." : "Transcribe & Edit"}</button>
          </div>
          <div style={{ marginTop: 12 }}>
            <strong>Note:</strong> After transcription you'll be able to edit text and export a Tamil `.docx`.
          </div>
        </div>
      ) : (
        <Editor segments={segments} onBack={() => setSegments(null)} />
      )}
    </div>
  );
}
