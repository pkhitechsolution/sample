import React from "react";
import { NavLink } from "react-router-dom";
import styles from "./Sidebar.module.css";

const menuItems = [
  { path: "/", label: "Dashboard" },
  { path: "/accounts", label: "Accounts" },
  { path: "/talent-registry", label: "Talent Registry" },
  { path: "/teams", label: "Teams" },
  { path: "/tournaments", label: "Tournaments" },
  { path: "/matches", label: "Matches" },
  { path: "/officials", label: "Officials" },
  { path: "/communications", label: "Communications" },
  { path: "/media-management", label: "Media" },
  { path: "/inventory", label: "Inventory" },
  { path: "/performance", label: "Performance" },
  { path: "/grants", label: "Grants" },
  { path: "/reports", label: "Reports" },
];

export default function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <h2 className={styles.brandTitle}>Sports TMS</h2>
        <p className={styles.brandSubtitle}>Management System</p>
      </div>

      <nav className={styles.nav}>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}