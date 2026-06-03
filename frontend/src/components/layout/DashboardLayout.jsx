import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import "./DashboardLayout.css";

const menuItems = [
  { label: "Dashboard", path: "/" },
  { label: "Accounts", path: "/accounts" },
  { label: "Talent Registry", path: "/talent-registry" },
  { label: "Teams", path: "/teams" },
  { label: "Tournaments", path: "/tournaments" },
  { label: "Matches", path: "/matches" },
  { label: "Officials", path: "/officials" },
  { label: "Communications", path: "/communications" },
  { label: "Media", path: "/media" },
  { label: "Inventory", path: "/inventory" },
  { label: "Performance", path: "/performance" },
  { label: "Grants", path: "/grants" },
  { label: "Reports", path: "/reports" },
];

export default function DashboardLayout() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebarBrand">
          <h2>Sports TMS</h2>
          <p>Management System</p>
        </div>

        <nav className="sidebarMenu">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                isActive ? "sidebarLink active" : "sidebarLink"
              }
            >
              <span className="sidebarLabel">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="mainContent">
        <Outlet />
      </main>
    </div>
  );
}