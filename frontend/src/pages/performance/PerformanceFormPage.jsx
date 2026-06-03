import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./Performance.module.css";
import {
  createPerformanceRecord,
  getPerformanceRecord,
  updatePerformanceRecord,
} from "../../api/performance";

const initialForm = {
  student_name: "",
  sport: "Athletics",
  event_name: "",
  performance_score: "",
  performance_level: "average",
  performance_date: new Date().toISOString().slice(0, 10),
  coach_name: "",
  remarks: "",
};

export default function PerformanceFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadRecord = async () => {
      if (!isEdit) return;

      try {
        setLoading(true);
        const response = await getPerformanceRecord(id);
        const data = response?.data || {};

        setFormData({
          student_name: data?.student_name || "",
          sport: data?.sport || "Athletics",
          event_name: data?.event_name || "",
          performance_score: data?.performance_score ?? "",
          performance_level: data?.performance_level || "average",
          performance_date: data?.performance_date || new Date().toISOString().slice(0, 10),
          coach_name: data?.coach_name || "",
          remarks: data?.remarks || "",
        });
      } catch (error) {
        console.error("Load failed:", error);
        alert(
          error?.response?.data?.detail ||
            error?.response?.data?.message ||
            "Failed to load performance record."
        );
      } finally {
        setLoading(false);
      }
    };

    loadRecord();
  }, [id, isEdit]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.student_name.trim()) {
      alert("Student name is required.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...formData,
        performance_score:
          formData.performance_score === ""
            ? 0
            : Number(formData.performance_score),
      };

      if (isEdit) {
        await updatePerformanceRecord(id, payload);
        alert("Performance record updated successfully.");
      } else {
        await createPerformanceRecord(payload);
        alert("Performance record created successfully.");
      }

      navigate("/performance");
    } catch (error) {
      console.error("Save failed:", error);
      alert(
        error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Failed to save performance record."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.page}>Loading performance record...</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.formCard}>
        <div className={styles.formHeader}>
          <div className={styles.heroBadge}>SPORTS TALENT MANAGEMENT</div>
          <h1 className={styles.formTitle}>
            {isEdit ? "Edit Performance" : "Add Performance"}
          </h1>
          <p className={styles.formSubtitle}>
            Create, update, and maintain performance details with the same professional layout.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.formGrid}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Student Name</label>
            <input
              type="text"
              name="student_name"
              value={formData.student_name}
              onChange={handleChange}
              className={styles.formInput}
              placeholder="Enter student name"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Sport</label>
            <input
              type="text"
              name="sport"
              value={formData.sport}
              onChange={handleChange}
              className={styles.formInput}
              placeholder="Enter sport name"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Event Name</label>
            <input
              type="text"
              name="event_name"
              value={formData.event_name}
              onChange={handleChange}
              className={styles.formInput}
              placeholder="Enter event name"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Coach Name</label>
            <input
              type="text"
              name="coach_name"
              value={formData.coach_name}
              onChange={handleChange}
              className={styles.formInput}
              placeholder="Enter coach name"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Performance Score</label>
            <input
              type="number"
              name="performance_score"
              value={formData.performance_score}
              onChange={handleChange}
              className={styles.formInput}
              placeholder="Enter score"
              min="0"
              step="0.01"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Performance Level</label>
            <select
              name="performance_level"
              value={formData.performance_level}
              onChange={handleChange}
              className={styles.formInput}
            >
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="average">Average</option>
              <option value="needs_improvement">Needs Improvement</option>
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Performance Date</label>
            <input
              type="date"
              name="performance_date"
              value={formData.performance_date}
              onChange={handleChange}
              className={styles.formInput}
            />
          </div>

          <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
            <label className={styles.fieldLabel}>Remarks</label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              className={styles.formTextarea}
              placeholder="Enter remarks"
              rows={5}
            />
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => navigate("/performance")}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={saving}
            >
              {saving ? "Saving..." : isEdit ? "Update Performance" : "Save Performance"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}