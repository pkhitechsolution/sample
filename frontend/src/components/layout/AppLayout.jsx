import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

export default function AppLayout() {
  const location = useLocation();

  const linkStyle = (path) => ({
    display: "block",
    padding: "10px 14px",
    marginBottom: "8px",
    borderRadius: "8px",
    textDecoration: "none",
    color: location.pathname.startsWith(path) ? "#ffffff" : "#111827",
    background: location.pathname.startsWith(path) ? "#142B71" : "transparent",
    fontWeight: 600,
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "240px 1fr",
        background: "#f3f4f6",
      }}
    >
      <aside
        style={{
          background: "#ffffff",
          borderRight: "1px solid #e5e7eb",
          padding: "20px",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: "20px", fontSize: "20px" }}>
          Sports Admin
        </h2>

        <nav>
          <Link to="/talent-registry" style={linkStyle("/talent-registry")}>
            Talent Registry
          </Link>

          <Link to="/teams" style={linkStyle("/teams")}>
            Teams
          </Link>
        </nav>
      </aside>

      <main style={{ padding: "20px" }}>
        <Outlet />
      </main>
    </div>
  );
}