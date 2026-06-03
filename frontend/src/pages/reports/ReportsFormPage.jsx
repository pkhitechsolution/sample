import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./Reports.module.css";
import { createReport, getReport, updateReport } from "../../api/reports";

const initialForm = {
  title: "",
  report_type: "performance",
  category: "",
  status: "draft",
  summary: "",
  description: "",
  prepared_by: "",
  report_date: new Date().toISOString().slice(0, 10),
};

export default function ReportFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadReport = async () => {
      if (!isEdit) return;

      try {
        setLoading(true);
        const response = await getReport(id);
        const data = response?.data || {};

        setFormData({
          title: data?.title || "",
          report_type: data?.report_type || "performance",
          category: data?.category || "",
          status: data?.status || "draft",
          summary: data?.summary || "",
          description: data?.description || "",
          prepared_by: data?.prepared_by || "",
          report_date: data?.report_date || new Date().toISOString().slice(0, 10),
        });
      } catch (error) {
        console.error("Load failed:", error);
        alert(
          error?.response?.data?.detail ||
            error?.response?.data?.message ||
            "Failed to load report."
        );
      } finally {
        setLoading(false);
      }
    };

    loadReport();
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

    if (!formData.title.trim()) {
      alert("Title is required.");
      return;
    }

    try {
      setSaving(true);

      if (isEdit) {
        await updateReport(id, formData);
        alert("Report updated successfully.");
      } else {
        await createReport(formData);
        alert("Report created successfully.");
      }

      navigate("/reports");
    } catch (error) {
      console.error("Save failed:", error);
      alert(
        error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Failed to save report."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.page}>Loading report...</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.formCard}>
        <div className={styles.formHeader}>
          <div className={styles.heroBadge}>SPORTS TALENT MANAGEMENT</div>
          <h1 className={styles.formTitle}>
            {isEdit ? "Edit Report" : "Add Report"}
          </h1>
          <p className={styles.formSubtitle}>
            Create, update, and maintain report details with the same professional layout.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.formGrid}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={styles.formInput}
              placeholder="Enter report title"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Report Date</label>
            <input
              type="date"
              name="report_date"
              value={formData.report_date}
              onChange={handleChange}
              className={styles.formInput}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Type</label>
            <select
              name="report_type"
              value={formData.report_type}
              onChange={handleChange}
              className={styles.formInput}
            >
              <option value="performance">Performance</option>
              <option value="financial">Financial</option>
              <option value="attendance">Attendance</option>
              <option value="team">Team</option>
              <option value="player">Player</option>
              <option value="medical">Medical</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className={styles.formInput}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Category</label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={styles.formInput}
              placeholder="Enter category"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Prepared By</label>
            <input
              type="text"
              name="prepared_by"
              value={formData.prepared_by}
              onChange={handleChange}
              className={styles.formInput}
              placeholder="Enter prepared by"
            />
          </div>

          <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
            <label className={styles.fieldLabel}>Summary</label>
            <textarea
              name="summary"
              value={formData.summary}
              onChange={handleChange}
              className={styles.formTextarea}
              placeholder="Enter report summary"
              rows={4}
            />
          </div>

          <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
            <label className={styles.fieldLabel}>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={styles.formTextarea}
              placeholder="Enter report description"
              rows={6}
            />
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => navigate("/reports")}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={saving}
            >
              {saving ? "Saving..." : isEdit ? "Update Report" : "Save Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}