import React, { useState } from "react";
import ReactQuill from "react-quill-new"; // Use the new fork
import "react-quill-new/dist/quill.snow.css"; // Import the Snow theme
import { postMakeDocx } from "../api";

export default function Editor({ segments, onBack }) {
  const [edited, setEdited] = useState(segments.map((s) => ({ ...s })));
  const [loading, setLoading] = useState(false);
  const [activeSegment, setActiveSegment] = useState(null);

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
        padding: "clamp(15px, 4vw, 25px)",
        maxWidth: 900,
        margin: "0 auto",
        background: "linear-gradient(135deg, #f9f9f9, #eef2ff)",
        borderRadius: 16,
        boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        transition: "all 0.3s ease-in-out",
        minHeight: "100vh",
      }}
    >
      {/* Header Section */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "15px",
          marginBottom: "25px",
          paddingBottom: "15px",
          borderBottom: "1px solid rgba(0,0,0,0.1)",
        }}
      >
        <button
          onClick={onBack}
          style={{
            alignSelf: "flex-start",
            padding: "10px 18px 10px 14px",
            borderRadius: "25px",
            border: "none",
            cursor: "pointer",
            background: "linear-gradient(135deg, #6e8efb, #a777e3)",
            color: "white",
            fontWeight: "600",
            boxShadow: "0 5px 12px rgba(0,0,0,0.15)",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "scale(1.05) translateX(-3px)";
            e.target.style.boxShadow = "0 7px 15px rgba(0,0,0,0.2)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "scale(1)";
            e.target.style.boxShadow = "0 5px 12px rgba(0,0,0,0.15)";
          }}
        >
          <span style={{ fontSize: "18px" }}>←</span> Back to Recording
        </button>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "15px" }}>
          <h2
            style={{
              margin: 0,
              fontSize: "clamp(20px, 5vw, 24px)",
              fontWeight: 600,
              color: "#333",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span style={{ 
              background: "linear-gradient(135deg, #6e8efb, #a777e3)",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px"
            }}>✏️</span>
            Edit Transcription
          </h2>
          
          <div style={{ fontSize: "14px", color: "#666", background: "rgba(255,255,255,0.7)", padding: "6px 12px", borderRadius: "20px" }}>
            {segments.length} segment{segments.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Segments Container */}
      <div style={{ marginBottom: "30px" }}>
        {edited.map((seg, idx) => (
          <div
            key={idx}
            style={{
              marginBottom: "20px",
              padding: "20px",
              border: activeSegment === idx ? "2px solid #6e8efb" : "1px solid #ddd",
              borderRadius: "12px",
              background: "white",
              boxShadow: activeSegment === idx 
                ? "0 8px 20px rgba(110, 142, 251, 0.2)" 
                : "0 4px 12px rgba(0,0,0,0.05)",
              transition: "all 0.3s ease",
              cursor: "pointer",
            }}
            onClick={() => setActiveSegment(idx)}
            onMouseEnter={(e) => {
              if (activeSegment !== idx) {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.1)";
              }
            }}
            onMouseLeave={(e) => {
              if (activeSegment !== idx) {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)";
              }
            }}
          >
            <div style={{ 
              display: "flex", 
              flexWrap: "wrap", 
              alignItems: "center", 
              gap: "10px", 
              marginBottom: "15px",
              fontWeight: "600", 
              color: "#555",
              fontSize: "15px"
            }}>
              <span style={{ 
                background: "linear-gradient(135deg, #6e8efb, #a777e3)", 
                color: "white", 
                padding: "4px 10px", 
                borderRadius: "20px",
                fontSize: "13px"
              }}>
                {seg.speaker}
              </span>
              <span style={{ color: "#888" }}>
                {seg.start.toFixed(2)}s - {seg.end.toFixed(2)}s
              </span>
            </div>

            <ReactQuill
              theme="snow"
              value={seg.text}
              onChange={(val) => updateText(idx, val)}
              style={{
                borderRadius: "8px",
                background: "#fafafa",
                minHeight: "120px",
                border: "none",
              }}
              modules={{
                toolbar: [
                  [{ 'header': [1, 2, false] }],
                  ['bold', 'italic', 'underline'],
                  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                  ['clean']
                ]
              }}
            />
          </div>
        ))}
      </div>

      {/* Fixed Action Bar on Mobile, Normal on Desktop */}
      <div style={{
        position: "sticky",
        bottom: "20px",
        padding: "15px",
        background: "rgba(255,255,255,0.95)",
        borderRadius: "16px",
        boxShadow: "0 -5px 20px rgba(0,0,0,0.1)",
        border: "1px solid rgba(0,0,0,0.05)",
        zIndex: 10,
        marginTop: "30px"
      }}>
        <div style={{ 
          display: "flex", 
          justifyContent: "center",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "15px"
        }}>
          <button
            onClick={onBack}
            style={{
              padding: "12px 20px",
              borderRadius: "30px",
              border: "1px solid #6e8efb",
              cursor: "pointer",
              background: "transparent",
              color: "#6e8efb",
              fontSize: "15px",
              fontWeight: "600",
              transition: "all 0.3s ease",
              flex: "1",
              minWidth: "140px"
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "#6e8efb";
              e.target.style.color = "white";
              e.target.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "transparent";
              e.target.style.color = "#6e8efb";
              e.target.style.transform = "translateY(0)";
            }}
          >
            Cancel
          </button>
          
          <button
            onClick={exportDocx}
            disabled={loading}
            style={{
              padding: "14px 26px",
              borderRadius: "30px",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              background: loading
                ? "linear-gradient(135deg, #ccc, #999)"
                : "linear-gradient(135deg, #42e695, #3bb2b8)",
              color: "white",
              fontSize: "16px",
              fontWeight: "600",
              boxShadow: loading 
                ? "0 4px 10px rgba(0,0,0,0.1)" 
                : "0 6px 15px rgba(0,0,0,0.2)",
              transition: "all 0.3s ease",
              flex: "2",
              minWidth: "200px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 8px 20px rgba(0,0,0,0.25)";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 6px 15px rgba(0,0,0,0.2)";
              }
            }}
          >
            {loading ? (
              <>
                <span style={{ 
                  width: "16px", 
                  height: "16px", 
                  border: "2px solid transparent", 
                  borderTop: "2px solid white", 
                  borderRadius: "50%", 
                  animation: "spin 1s linear infinite",
                  display: "inline-block"
                }}></span>
                Generating Document...
              </>
            ) : (
              <>
                <span style={{ fontSize: "18px" }}>⬇</span>
                Download .docx
              </>
            )}
          </button>
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @media (max-width: 768px) {
            .ql-toolbar {
              flex-wrap: wrap;
            }
            
            .ql-formats {
              margin-bottom: 8px;
            }
          }
          
          @media (max-width: 480px) {
            .ql-editor {
              font-size: 16px !important; /* Prevent zoom on iOS */
            }
          }
        `}
      </style>
    </div>
  );
}