import React, { useEffect, useState } from "react";
import styles from "./ReportsPage.module.css";
import { getReportsDashboard } from "../../api/reports";

export default function ReportsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await getReportsDashboard();
      setData(res.data);
    } catch (error) {
      console.error("Reports load error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return <div className={styles.page}>Loading reports...</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div>
          <h1 className={styles.title}>Reports Module</h1>
          <p className={styles.subtitle}>
            View combined summaries from performance and grants modules.
          </p>
        </div>
      </div>

      <div className={styles.cards}>
        <div className={styles.card}>
          <span>Total Performance Records</span>
          <strong>{data?.cards?.total_performance_records || 0}</strong>
        </div>
        <div className={styles.card}>
          <span>Average Performance Score</span>
          <strong>{data?.cards?.avg_performance_score || 0}</strong>
        </div>
        <div className={styles.card}>
          <span>Total Grants</span>
          <strong>{data?.cards?.total_grants || 0}</strong>
        </div>
        <div className={styles.card}>
          <span>Total Requested</span>
          <strong>₹ {data?.cards?.total_requested || 0}</strong>
        </div>
        <div className={styles.card}>
          <span>Total Approved</span>
          <strong>₹ {data?.cards?.total_approved || 0}</strong>
        </div>
      </div>

      <div className={styles.twoColumn}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Recent Performance</h2>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Sport</th>
                  <th>Event</th>
                  <th>Score</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data?.recent_performance?.length ? (
                  data.recent_performance.map((item) => (
                    <tr key={item.id}>
                      <td>{item.student_name}</td>
                      <td>{item.sport}</td>
                      <td>{item.event_name}</td>
                      <td>{item.score}</td>
                      <td>{item.performance_date}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className={styles.emptyCell}>No performance records available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Recent Grants</h2>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Grant Name</th>
                  <th>Status</th>
                  <th>Requested</th>
                  <th>Approved</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data?.recent_grants?.length ? (
                  data.recent_grants.map((item) => (
                    <tr key={item.id}>
                      <td>{item.grant_name}</td>
                      <td>{item.status}</td>
                      <td>₹ {item.amount_requested}</td>
                      <td>₹ {item.amount_approved}</td>
                      <td>{item.applied_date}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className={styles.emptyCell}>No grant records available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}