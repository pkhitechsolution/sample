import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./Grants.module.css";
import { createGrant, getGrant, updateGrant } from "../../api/grants";

const initialForm = {
  grant_name: "",
  grant_type: "sports",
  funding_agency: "",
  amount_requested: "",
  amount_approved: "",
  status: "pending",
  applied_date: new Date().toISOString().slice(0, 10),
  approval_date: "",
  purpose: "",
  remarks: "",
};

export default function GrantsFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadGrant = async () => {
      if (!isEdit) return;

      try {
        setLoading(true);
        const response = await getGrant(id);
        const data = response?.data || {};

        setFormData({
          grant_name: data?.grant_name || "",
          grant_type: data?.grant_type || "sports",
          funding_agency: data?.funding_agency || "",
          amount_requested: data?.amount_requested ?? "",
          amount_approved: data?.amount_approved ?? "",
          status: data?.status || "pending",
          applied_date:
            data?.applied_date || new Date().toISOString().slice(0, 10),
          approval_date: data?.approval_date || "",
          purpose: data?.purpose || "",
          remarks: data?.remarks || "",
        });
      } catch (error) {
        console.error("Load failed:", error);
        alert(
          error?.response?.data?.detail ||
            error?.response?.data?.message ||
            "Failed to load grant."
        );
      } finally {
        setLoading(false);
      }
    };

    loadGrant();
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

    if (!formData.grant_name.trim()) {
      alert("Grant name is required.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...formData,
        amount_requested:
          formData.amount_requested === "" ? 0 : Number(formData.amount_requested),
        amount_approved:
          formData.amount_approved === "" ? 0 : Number(formData.amount_approved),
      };

      if (isEdit) {
        await updateGrant(id, payload);
        alert("Grant updated successfully.");
      } else {
        await createGrant(payload);
        alert("Grant created successfully.");
      }

      navigate("/grants");
    } catch (error) {
      console.error("Save failed:", error);
      alert(
        error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Failed to save grant."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.page}>Loading grant...</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.formCard}>
        <div className={styles.formHeader}>
          <div className={styles.heroBadge}>SPORTS TALENT MANAGEMENT</div>
          <h1 className={styles.formTitle}>
            {isEdit ? "Edit Grant" : "Add Grant"}
          </h1>
          <p className={styles.formSubtitle}>
            Create, update, and maintain grant details with the same professional layout.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.formGrid}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Grant Name</label>
            <input
              type="text"
              name="grant_name"
              value={formData.grant_name}
              onChange={handleChange}
              className={styles.formInput}
              placeholder="Enter grant name"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Grant Type</label>
            <select
              name="grant_type"
              value={formData.grant_type}
              onChange={handleChange}
              className={styles.formInput}
            >
              <option value="sports">Sports</option>
              <option value="education">Education</option>
              <option value="medical">Medical</option>
              <option value="infrastructure">Infrastructure</option>
              <option value="equipment">Equipment</option>
              <option value="training">Training</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Funding Agency</label>
            <input
              type="text"
              name="funding_agency"
              value={formData.funding_agency}
              onChange={handleChange}
              className={styles.formInput}
              placeholder="Enter funding agency"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className={styles.formInput}
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Applied Date</label>
            <input
              type="date"
              name="applied_date"
              value={formData.applied_date}
              onChange={handleChange}
              className={styles.formInput}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Approval Date</label>
            <input
              type="date"
              name="approval_date"
              value={formData.approval_date}
              onChange={handleChange}
              className={styles.formInput}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Amount Requested</label>
            <input
              type="number"
              name="amount_requested"
              value={formData.amount_requested}
              onChange={handleChange}
              className={styles.formInput}
              placeholder="Enter requested amount"
              min="0"
              step="0.01"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Amount Approved</label>
            <input
              type="number"
              name="amount_approved"
              value={formData.amount_approved}
              onChange={handleChange}
              className={styles.formInput}
              placeholder="Enter approved amount"
              min="0"
              step="0.01"
            />
          </div>

          <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
            <label className={styles.fieldLabel}>Purpose</label>
            <textarea
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              className={styles.formTextarea}
              placeholder="Enter purpose"
              rows={4}
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
              onClick={() => navigate("/grants")}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={saving}
            >
              {saving ? "Saving..." : isEdit ? "Update Grant" : "Save Grant"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}