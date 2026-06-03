import React from "react";
import styles from "./SportsPage.module.css";

export default function SportTable({ sports, loading, onEdit, onDelete }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Sport Name</th>
            <th>Category</th>
            <th>Min Players</th>
            <th>Max Players</th>
            <th>Status</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="8" className={styles.emptyCell}>
                Loading...
              </td>
            </tr>
          ) : sports.length === 0 ? (
            <tr>
              <td colSpan="8" className={styles.emptyCell}>
                No sports found
              </td>
            </tr>
          ) : (
            sports.map((sport) => (
              <tr key={sport.id}>
                <td>{sport.id}</td>
                <td>{sport.name}</td>
                <td>{sport.category}</td>
                <td>{sport.min_players}</td>
                <td>{sport.max_players}</td>
                <td>{sport.is_active ? "Active" : "Inactive"}</td>
                <td>{sport.description || "-"}</td>
                <td>
                  <div className={styles.actionRow}>
                    <button
                      type="button"
                      className={styles.editBtn}
                      onClick={() => onEdit(sport)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className={styles.deleteBtn}
                      onClick={() => onDelete(sport.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
} 