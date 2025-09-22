// frontend/src/components/Editor.jsx
import React, { useState } from "react";
import ReactQuill from "react-quill-new"; // Use the new fork
import "react-quill-new/dist/quill.snow.css"; // Import the Snow theme
import { postMakeDocx } from "../api";

export default function Editor({ segments, onBack }) {
  const [edited, setEdited] = useState(segments.map((s) => ({ ...s })));
  const [loading, setLoading] = useState(false);

  // Update text for a segment
  const updateText = (idx, value) => {
    const copy = [...edited];
    copy[idx].text = value;
    setEdited(copy);
  };

  // Export the edited segments as DOCX
  const exportDocx = async () => {
    setLoading(true);
    try {
      const payload = { segments: edited };
      const res = await postMakeDocx(payload);

      const blob = new Blob([res.data], {
        type:
          res.headers["content-type"] ||
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "tamil_transcription.docx";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Failed to create DOCX. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: 25,
        maxWidth: 900,
        margin: "0 auto",
        background: "linear-gradient(135deg, #f9f9f9, #eef2ff)",
        borderRadius: 16,
        boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
        fontFamily: "Segoe UI, sans-serif",
        transition: "all 0.3s ease-in-out",
      }}
    >
      {/* Back Button */}
      <button
        onClick={onBack}
        style={{
          marginBottom: 20,
          padding: "10px 18px",
          borderRadius: 25,
          border: "none",
          cursor: "pointer",
          background: "linear-gradient(135deg, #6e8efb, #a777e3)",
          color: "white",
          fontWeight: "bold",
          boxShadow: "0 5px 12px rgba(0,0,0,0.15)",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) =>
          (e.target.style.transform = "scale(1.05) translateX(-3px)")
        }
        onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
      >
        ← Back
      </button>

      <h2
        style={{
          marginBottom: 20,
          fontSize: 24,
          fontWeight: 600,
          color: "#333",
          textAlign: "center",
        }}
      >
        ✏️ Edit Transcription
      </h2>

      <div>
        {edited.map((seg, idx) => (
          <div
            key={idx}
            style={{
              marginBottom: 20,
              padding: 16,
              border: "1px solid #ddd",
              borderRadius: 12,
              background: "white",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow =
                "0 8px 20px rgba(0,0,0,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(0,0,0,0.05)";
            }}
          >
            <div style={{ fontWeight: "bold", marginBottom: 10, color: "#555" }}>
              {seg.speaker} [{seg.start.toFixed(2)}s - {seg.end.toFixed(2)}s]
            </div>

            <ReactQuill
              theme="snow"
              value={seg.text}
              onChange={(val) => updateText(idx, val)}
              style={{
                borderRadius: 8,
                background: "#fafafa",
                minHeight: 100,
              }}
            />
          </div>
        ))}
      </div>

      {/* Download Button */}
      <div style={{ marginTop: 20, textAlign: "center" }}>
        <button
          onClick={exportDocx}
          disabled={loading}
          style={{
            padding: "12px 26px",
            borderRadius: 30,
            border: "none",
            cursor: "pointer",
            background: loading
              ? "linear-gradient(135deg, #ff4e50, #f9d423)"
              : "linear-gradient(135deg, #42e695, #3bb2b8)",
            color: "white",
            fontSize: 16,
            fontWeight: "bold",
            boxShadow: "0 6px 15px rgba(0,0,0,0.2)",
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
          {loading ? "⏳ Generating..." : "⬇ Download .docx"}
        </button>
      </div>
    </div>
  );
}
