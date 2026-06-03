import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div style={{ padding: "40px" }}>
      <h2>Page Not Found</h2>
      <p>The page you are trying to access does not exist.</p>
      <Link to="/dashboard">Go Back to Dashboard</Link>
    </div>
  );
}