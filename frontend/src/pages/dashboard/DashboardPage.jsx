import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./DashboardPage.module.css";

const modules = [
  {
    title: "Accounts Module",
    description: "Manage finance, expenses, payments and accounting records.",
    buttonText: "Open Accounts",
    path: "/accounts",
  },
  {
    title: "Talent Registry Module",
    description: "Manage player profiles, registration details and talent records.",
    buttonText: "Open Talent Registry",
    path: "/talent-registry",
  },
  {
    title: "Teams Module",
    description: "Create and manage teams linked with sports categories.",
    buttonText: "Open Teams",
    path: "/teams",
  },
  {
    title: "Tournaments Module",
    description: "Manage tournaments, schedules and event details.",
    buttonText: "Open Tournaments",
    path: "/tournaments",
  },
  {
    title: "Matches Module",
    description: "Create, update and manage tournament matches.",
    buttonText: "Open Matches",
    path: "/matches",
  },
  {
    title: "Officials Module",
    description: "Manage referees, umpires and other match officials.",
    buttonText: "Open Officials",
    path: "/officials",
  },
  {
    title: "Communications Module",
    description: "Handle announcements, notices and internal communication workflows.",
    buttonText: "Open Communications",
    path: "/communications",
  },
  {
    title: "Media Module",
    description: "Store and manage sports photos, videos and digital media content.",
    buttonText: "Open Media",
    path: "/media",
  },
  {
    title: "Inventory Module",
    description: "Track equipment, stock availability and item movement records.",
    buttonText: "Open Inventory",
    path: "/inventory",
  },
  {
    title: "Performance Module",
    description: "Monitor player performance, metrics and improvement records.",
    buttonText: "Open Performance",
    path: "/performance",
    featured: true,
  },
  {
    title: "Grants Module",
    description: "Manage sponsorships, grants and funding-related details.",
    buttonText: "Open Grants",
    path: "/grants",
    featured: true,
  },
  {
    title: "Reports Module",
    description: "Generate reports and summaries across all sports modules.",
    buttonText: "Open Reports",
    path: "/reports",
    featured: true,
  },
];

export default function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.dashboardPage}>
      <section className={styles.heroSection}>
        <div className={styles.heroBadge}>SPORTS TALENT MANAGEMENT SYSTEM</div>
        <h1 className={styles.heroTitle}>
          Welcome to Sports Talent Management System
        </h1>
        <p className={styles.heroSubtitle}>
          Access all core modules from one place and continue your work quickly.
        </p>
      </section>

      <section className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Quick Access Modules</h2>
          <p className={styles.sectionSubtitle}>
            Choose a module to continue.
          </p>
        </div>
      </section>

      <section className={styles.modulesGrid}>
        {modules.map((module) => (
          <div
            key={module.path}
            className={`${styles.moduleCard} ${
              module.featured ? styles.featuredCard : ""
            }`}
          >
            <div className={styles.cardTopLine}></div>

            <div className={styles.cardContent}>
              <h3 className={styles.moduleTitle}>{module.title}</h3>
              <p className={styles.moduleDescription}>{module.description}</p>
            </div>

            <div className={styles.cardFooter}>
              <button
                type="button"
                className={`${styles.moduleButton} ${
                  module.featured ? styles.featuredButton : ""
                }`}
                onClick={() => navigate(module.path)}
              >
                {module.buttonText}
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}