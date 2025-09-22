import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [menuOpen, setMenuOpen] = useState(false);

  // Listen for window resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const linkStyle = (path) => ({
    textDecoration: "none",
    color: location.pathname === path ? "#38BDF8" : "#fff",
    fontWeight: location.pathname === path ? "bold" : "normal",
    fontSize: "1rem",
    padding: "8px 0",
    display: "block",
    transition: "color 0.3s ease",
  });

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "18px 24px",
        background: "#1E293B",
        color: "#fff",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Brand / Logo */}
      <div
        style={{
          fontSize: "1.5rem",
          fontWeight: "bold",
          color: "#38BDF8",
          cursor: "pointer",
        }}
      >
       ஒலி <span style={{ color: "#FACC15" }}>குறிப்பு</span>
      </div>

      {/* Desktop Links */}
      {!isMobile ? (
        <div style={{ display: "flex", gap: "20px" }}>
          <Link to="/" style={linkStyle("/")}>
            Recorder
          </Link>
          <Link to="/room" style={linkStyle("/room")}>
            Room
          </Link>
        </div>
      ) : (
        // Mobile Menu
        <div>
          <div
            style={{
              fontSize: "1.5rem",
              cursor: "pointer",
              userSelect: "none",
            }}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            ☰
          </div>
          {menuOpen && (
            <div
              style={{
                position: "absolute",
                top: "60px",
                right: "20px",
                background: "#334155",
                borderRadius: "8px",
                padding: "12px 20px",
                boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                animation: "fadeIn 0.3s ease",
              }}
            >
              <Link
                to="/"
                style={linkStyle("/")}
                onClick={() => setMenuOpen(false)}
              >
                Recorder
              </Link>
              <Link
                to="/room"
                style={linkStyle("/room")}
                onClick={() => setMenuOpen(false)}
              >
                Room
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
