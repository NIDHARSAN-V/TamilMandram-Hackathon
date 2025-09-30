import React, { useState, useRef } from "react";

export default function AudioRecorder({ onFileReady }) {
  const [recording, setRecording] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isRecordingHovered, setIsRecordingHovered] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  async function startRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Browser does not support audio recording");
      return;
    }
    try {
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
        
        // Stop all tracks in the stream
        stream.getTracks().forEach(track => track.stop());
      };
      mr.start();
      setRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone. Please check permissions.");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && recording) {
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
        margin: "20px auto",
        padding: "25px 20px",
        maxWidth: "500px",
        width: "90%",
        borderRadius: "20px",
        background: "linear-gradient(135deg, #6e8efb, #a777e3)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        color: "white",
        textAlign: "center",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        transition: "all 0.3s ease-in-out",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated background elements */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: "linear-gradient(90deg, #ff8a00, #e52e71)",
          transform: isHovered ? "scaleX(1)" : "scaleX(0)",
          transformOrigin: "0% 50%",
          transition: "transform 0.6s ease",
        }}
      />
      
      <h2
        style={{
          margin: "0 0 20px 0",
          fontSize: "clamp(20px, 5vw, 26px)",
          fontWeight: "600",
          letterSpacing: "0.5px",
          textShadow: "1px 1px 4px rgba(0,0,0,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
        }}
      >
        <span style={{ 
          display: "inline-block", 
          animation: recording ? "pulse 1.5s infinite" : "none",
          borderRadius: "50%",
          background: recording ? "rgba(255,0,0,0.2)" : "transparent",
          padding: recording ? "5px" : "0",
        }}>
          🎙️
        </span>
        Audio Recorder
      </h2>

      <div style={{ 
        marginBottom: "20px",
        position: "relative",
      }}>
        <input
          type="file"
          id="audio-file-input"
          accept="audio/*"
          onChange={onFileSelect}
          style={{
            position: "absolute",
            opacity: 0,
            width: "0.1px",
            height: "0.1px",
            overflow: "hidden",
            zIndex: -1,
          }}
        />
        <label
          htmlFor="audio-file-input"
          style={{
            display: "inline-block",
            padding: "12px 24px",
            borderRadius: "12px",
            border: "2px dashed rgba(255,255,255,0.7)",
            background: "rgba(255,255,255,0.1)",
            color: "white",
            cursor: "pointer",
            transition: "all 0.3s ease",
            fontSize: "14px",
            fontWeight: "500",
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "rgba(255,255,255,0.2)";
            e.target.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "rgba(255,255,255,0.1)";
            e.target.style.transform = "translateY(0)";
          }}
        >
          📁 Choose Audio File
        </label>
      </div>

      <div style={{ marginBottom: "15px" }}>
        <button
          onClick={recording ? stopRecording : startRecording}
          onMouseEnter={() => setIsRecordingHovered(true)}
          onMouseLeave={() => setIsRecordingHovered(false)}
          style={{
            padding: "14px 28px",
            borderRadius: "50px",
            border: "none",
            fontSize: "16px",
            fontWeight: "600",
            color: "white",
            cursor: "pointer",
            background: recording
              ? "linear-gradient(135deg, #ff4e50, #f9d423)"
              : "linear-gradient(135deg, #42e695, #3bb2b8)",
            boxShadow: isRecordingHovered 
              ? "0 8px 20px rgba(0,0,0,0.3)" 
              : "0 6px 15px rgba(0,0,0,0.2)",
            transform: isRecordingHovered 
              ? "scale(1.05) translateY(-3px)" 
              : recording ? "scale(1)" : "scale(1)",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            margin: "0 auto",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {recording ? (
            <>
              <span style={{ 
                display: "inline-block",
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: "white",
                animation: "pulse 1.5s infinite"
              }}></span>
              Stop Recording
            </>
          ) : (
            <>
              <span>🎤</span>
              Start Recording
            </>
          )}
        </button>
      </div>

      <div
        style={{
          marginTop: "15px",
          padding: "12px",
          borderRadius: "10px",
          background: "rgba(255,255,255,0.1)",
          fontSize: "14px",
          minHeight: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.3s ease-in-out",
          border: fileName ? "1px solid rgba(255,255,255,0.3)" : "none",
        }}
      >
        {fileName ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "16px" }}>✅</span>
            <span style={{ 
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "200px"
            }}>
              {fileName}
            </span>
          </div>
        ) : (
          <span style={{ opacity: 0.8, fontStyle: "italic" }}>
            No file chosen yet
          </span>
        )}
      </div>

      {/* Recording status indicator */}
      {recording && (
        <div
          style={{
            marginTop: "15px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            fontSize: "14px",
            color: "rgba(255,255,255,0.9)",
            animation: "fadeIn 0.5s ease",
          }}
        >
          <div style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            backgroundColor: "#ff4e50",
            animation: "pulse 1.5s infinite"
          }}></div>
          <span>Recording in progress...</span>
        </div>
      )}

      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @media (max-width: 480px) {
            button, label {
              width: 100%;
              padding: 12px;
            }
          }
        `}
      </style>
    </div>
  );
}