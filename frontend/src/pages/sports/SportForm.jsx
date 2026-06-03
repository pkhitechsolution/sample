import React from "react";
import styles from "./SportsPage.module.css";

export default function SportForm({
  formData,
  editingId,
  onChange,
  onSubmit,
  onClear,
}) {
  return (
    <form onSubmit={onSubmit}>
      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label>Sport Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={onChange}
            placeholder="Enter sport name"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label>Category</label>
          <select name="category" value={formData.category} onChange={onChange}>
            <option value="indoor">Indoor</option>
            <option value="outdoor">Outdoor</option>
            <option value="both">Both</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>Min Players</label>
          <input
            type="number"
            name="min_players"
            value={formData.min_players}
            onChange={onChange}
            min="1"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label>Max Players</label>
          <input
            type="number"
            name="max_players"
            value={formData.max_players}
            onChange={onChange}
            min="1"
            required
          />
        </div>

        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
          <label>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={onChange}
            placeholder="Enter description"
            rows="4"
          />
        </div>

        <div className={`${styles.formGroup} ${styles.checkboxGroup}`}>
          <label>
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={onChange}
            />
            Active
          </label>
        </div>
      </div>

      <div className={styles.buttonRow}>
        <button type="submit" className={styles.primaryBtn}>
          {editingId ? "Update Sport" : "Add Sport"}
        </button>
        <button type="button" className={styles.secondaryBtn} onClick={onClear}>
          Clear
        </button>
      </div>
    </form>
  );
}