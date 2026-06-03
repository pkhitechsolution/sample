import React from "react";
import { useLocation } from "react-router-dom";

export default function Header() {
  const location = useLocation();

  const getTitle = () => {
    if (location.pathname === "/matches") return "Matches Management";
    if (location.pathname === "/performance") return "Performance Management";
    return "Dashboard";
  };

  return (
    <header className="top-header">
      <div>
        <h1>{getTitle()}</h1>
        <p>Sports Talent Management System</p>
      </div>
    </header>
  );
}