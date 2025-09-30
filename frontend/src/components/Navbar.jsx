import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Listen for window resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Listen for scroll to add background
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menu when route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const linkStyle = (path) => ({
    textDecoration: "none",
    color: location.pathname === path ? "#38BDF8" : "#fff",
    fontWeight: location.pathname === path ? "600" : "400",
    fontSize: "1rem",
    padding: "8px 16px",
    display: "block",
    transition: "all 0.3s ease",
    borderRadius: "8px",
    position: "relative",
    overflow: "hidden",
  });

  const mobileLinkStyle = (path) => ({
    ...linkStyle(path),
    padding: "12px 20px",
    textAlign: "center",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
  });

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 24px",
        background: scrolled ? "rgba(30, 41, 59, 0.95)" : "#1E293B",
        color: "#fff",
        position: "sticky",
        top: 0,
        zIndex: 100,
        backdropFilter: scrolled ? "blur(10px)" : "none",
        boxShadow: scrolled ? "0 4px 20px rgba(0, 0, 0, 0.1)" : "none",
        transition: "all 0.3s ease",
      }}
    >
      {/* Brand / Logo */}
      <Link 
        to="/" 
        style={{ 
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}
      >
        <div
          style={{
            fontSize: "1.8rem",
            fontWeight: "bold",
            color: "#38BDF8",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            transition: "transform 0.3s ease",
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
        >
          <span style={{ 
            display: "inline-block",
            animation: "pulse 2s infinite",
            padding: "4px"
          }}>
            ஒலி
          </span>
          <span style={{ 
            color: "#FACC15",
            marginLeft: "4px"
          }}>
            குறிப்பு
          </span>
        </div>
      </Link>

      {/* Desktop Links */}
      {!isMobile ? (
        <div style={{ 
          display: "flex", 
          gap: "8px",
          alignItems: "center"
        }}>
          <Link 
            to="/" 
            style={linkStyle("/")}
            onMouseEnter={(e) => {
              if (location.pathname !== "/") {
                e.target.style.background = "rgba(56, 189, 248, 0.1)";
              }
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== "/") {
                e.target.style.background = "transparent";
              }
            }}
          >
            Recorder
            {location.pathname === "/" && (
              <span style={{
                position: "absolute",
                bottom: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: "20px",
                height: "3px",
                background: "#38BDF8",
                borderRadius: "2px"
              }}></span>
            )}
          </Link>
          <Link 
            to="/room" 
            style={linkStyle("/room")}
            onMouseEnter={(e) => {
              if (location.pathname !== "/room") {
                e.target.style.background = "rgba(56, 189, 248, 0.1)";
              }
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== "/room") {
                e.target.style.background = "transparent";
              }
            }}
          >
            Room
            {location.pathname === "/room" && (
              <span style={{
                position: "absolute",
                bottom: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: "20px",
                height: "3px",
                background: "#38BDF8",
                borderRadius: "2px"
              }}></span>
            )}
          </Link>
        </div>
      ) : (
        // Mobile Menu
        <div style={{ position: "relative" }}>
          <div
            style={{
              fontSize: "1.8rem",
              cursor: "pointer",
              userSelect: "none",
              padding: "8px",
              borderRadius: "8px",
              transition: "background 0.3s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "44px",
              height: "44px",
            }}
            onClick={() => setMenuOpen(!menuOpen)}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            {menuOpen ? "✕" : "☰"}
          </div>
          
          {/* Mobile Menu Dropdown */}
          {menuOpen && (
            <div
              style={{
                position: "absolute",
                top: "52px",
                right: "0",
                background: "rgba(30, 41, 59, 0.98)",
                borderRadius: "12px",
                padding: "8px 0",
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
                animation: "slideDown 0.3s ease",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                minWidth: "180px",
                zIndex: 100,
              }}
            >
              <Link
                to="/"
                style={mobileLinkStyle("/")}
                onClick={() => setMenuOpen(false)}
              >
                Recorder
              </Link>
              <Link
                to="/room"
                style={mobileLinkStyle("/room")}
                onClick={() => setMenuOpen(false)}
              >
                Room
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Animation styles */}
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          
          @keyframes slideDown {
            from { 
              opacity: 0;
              transform: translateY(-10px);
            }
            to { 
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @media (max-width: 480px) {
            nav {
              padding: 12px 16px;
            }
          }
        `}
      </style>
    </nav>
  );
}