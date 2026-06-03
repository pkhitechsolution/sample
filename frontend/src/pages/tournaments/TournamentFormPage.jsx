import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createTournament,
  getTournamentById,
  updateTournament,
} from "../../api/tournaments";
import styles from "./TournamentFormPage.module.css";

const initialForm = {
  name: "",
  sport: "",
  format: "LEAGUE",
  age_group: "",
  gender_category: "Mixed",
  venue: "",
  organizer: "",
  contact_person: "",
  contact_phone: "",
  start_date: "",
  end_date: "",
  registration_last_date: "",
  max_teams: "",
  teams_count: "",
  matches_count: "",
  status: "Draft",
  description: "",
  rules: "",
  notes: "",
};

export default function TournamentFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;

    const fetchTournament = async () => {
      try {
        setLoading(true);
        const data = await getTournamentById(id);

        setForm({
          ...initialForm,
          ...data,
          max_teams: data?.max_teams ?? "",
          teams_count: data?.teams_count ?? "",
          matches_count: data?.matches_count ?? "",
          format: data?.format || "LEAGUE",
          gender_category: data?.gender_category || "Mixed",
          status: data?.status || "Draft",
        });
      } catch (error) {
        console.error("Failed to load tournament:", error);
        const message =
          error?.response?.data?.detail || "Failed to load tournament details.";
        alert(message);
      } finally {
        setLoading(false);
      }
    };

    fetchTournament();
  }, [id, isEdit]);

  const pageTitle = useMemo(
    () => (isEdit ? "Tournament Details" : "Tournament Details"),
    [isEdit]
  );

  const pageSubtitle = useMemo(
    () => "Fill in the required fields carefully and save the tournament profile.",
    []
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      alert("Tournament name is required.");
      return false;
    }

    if (!form.sport.trim()) {
      alert("Sport is required.");
      return false;
    }

    if (!form.start_date) {
      alert("Start date is required.");
      return false;
    }

    if (!form.end_date) {
      alert("End date is required.");
      return false;
    }

    if (form.end_date < form.start_date) {
      alert("End date cannot be earlier than start date.");
      return false;
    }

    if (form.max_teams !== "" && Number(form.max_teams) < 0) {
      alert("Max teams cannot be negative.");
      return false;
    }

    if (form.teams_count !== "" && Number(form.teams_count) < 0) {
      alert("Teams count cannot be negative.");
      return false;
    }

    if (form.matches_count !== "" && Number(form.matches_count) < 0) {
      alert("Matches count cannot be negative.");
      return false;
    }

    if (
      form.max_teams !== "" &&
      form.teams_count !== "" &&
      Number(form.teams_count) > Number(form.max_teams)
    ) {
      alert("Teams count cannot exceed max teams.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const payload = {
      name: form.name.trim(),
      sport: form.sport.trim(),
      format: form.format,
      age_group: form.age_group.trim(),
      gender_category: form.gender_category,
      venue: form.venue.trim(),
      organizer: form.organizer.trim(),
      contact_person: form.contact_person.trim(),
      contact_phone: form.contact_phone.trim(),
      start_date: form.start_date,
      end_date: form.end_date,
      registration_last_date: form.registration_last_date || null,
      max_teams: form.max_teams === "" ? 0 : Number(form.max_teams),
      teams_count: form.teams_count === "" ? 0 : Number(form.teams_count),
      matches_count: form.matches_count === "" ? 0 : Number(form.matches_count),
      status: form.status,
      description: form.description.trim(),
      rules: form.rules.trim(),
      notes: form.notes.trim(),
    };

    try {
      setSaving(true);

      if (isEdit) {
        await updateTournament(id, payload);
        alert("Tournament updated successfully.");
      } else {
        await createTournament(payload);
        alert("Tournament created successfully.");
      }

      navigate("/tournaments");
    } catch (error) {
      console.error("Save failed:", error);
      const data = error?.response?.data;

      if (data?.name?.[0]) {
        alert(`Name: ${data.name[0]}`);
      } else if (data?.sport?.[0]) {
        alert(`Sport: ${data.sport[0]}`);
      } else if (data?.start_date?.[0]) {
        alert(`Start Date: ${data.start_date[0]}`);
      } else if (data?.end_date?.[0]) {
        alert(`End Date: ${data.end_date[0]}`);
      } else if (data?.max_teams?.[0]) {
        alert(`Max Teams: ${data.max_teams[0]}`);
      } else if (data?.teams_count?.[0]) {
        alert(`Teams Count: ${data.teams_count[0]}`);
      } else if (data?.matches_count?.[0]) {
        alert(`Matches Count: ${data.matches_count[0]}`);
      } else if (data?.detail) {
        alert(data.detail);
      } else {
        alert("Failed to save tournament.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.formCard}>
          <div className={styles.loadingText}>Loading tournament details...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.formCard}>
        <div className={styles.formHeader}>
          <h2 className={styles.formTitle}>{pageTitle}</h2>
          <p className={styles.formText}>{pageSubtitle}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="name">Tournament Name</label>
              <input
                id="name"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter tournament name"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="sport">Sport</label>
              <input
                id="sport"
                type="text"
                name="sport"
                value={form.sport}
                onChange={handleChange}
                placeholder="Enter sport"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="format">Format</label>
              <select
                id="format"
                name="format"
                value={form.format}
                onChange={handleChange}
              >
                <option value="LEAGUE">League</option>
                <option value="KNOCKOUT">Knockout</option>
                <option value="ROUND_ROBIN">Round Robin</option>
                <option value="GROUP_STAGE">Group Stage</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="age_group">Age Group</label>
              <input
                id="age_group"
                type="text"
                name="age_group"
                value={form.age_group}
                onChange={handleChange}
                placeholder="Enter age group"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="gender_category">Gender Category</label>
              <select
                id="gender_category"
                name="gender_category"
                value={form.gender_category}
                onChange={handleChange}
              >
                <option value="Boys">Boys</option>
                <option value="Girls">Girls</option>
                <option value="Mixed">Mixed</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="venue">Venue</label>
              <input
                id="venue"
                type="text"
                name="venue"
                value={form.venue}
                onChange={handleChange}
                placeholder="Enter venue"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="organizer">Organizer</label>
              <input
                id="organizer"
                type="text"
                name="organizer"
                value={form.organizer}
                onChange={handleChange}
                placeholder="Enter organizer"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="contact_person">Contact Person</label>
              <input
                id="contact_person"
                type="text"
                name="contact_person"
                value={form.contact_person}
                onChange={handleChange}
                placeholder="Enter contact person"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="contact_phone">Contact Phone</label>
              <input
                id="contact_phone"
                type="text"
                name="contact_phone"
                value={form.contact_phone}
                onChange={handleChange}
                placeholder="Enter contact phone"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="start_date">Start Date</label>
              <input
                id="start_date"
                type="date"
                name="start_date"
                value={form.start_date}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="end_date">End Date</label>
              <input
                id="end_date"
                type="date"
                name="end_date"
                value={form.end_date}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="registration_last_date">Registration Last Date</label>
              <input
                id="registration_last_date"
                type="date"
                name="registration_last_date"
                value={form.registration_last_date}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                <option value="Draft">Draft</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="max_teams">Max Teams</label>
              <input
                id="max_teams"
                type="number"
                name="max_teams"
                value={form.max_teams}
                onChange={handleChange}
                placeholder="Enter max teams"
                min="0"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="teams_count">Teams Count</label>
              <input
                id="teams_count"
                type="number"
                name="teams_count"
                value={form.teams_count}
                onChange={handleChange}
                placeholder="Enter teams count"
                min="0"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="matches_count">Matches Count</label>
              <input
                id="matches_count"
                type="number"
                name="matches_count"
                value={form.matches_count}
                onChange={handleChange}
                placeholder="Enter matches count"
                min="0"
              />
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Enter description"
              />
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label htmlFor="rules">Rules</label>
              <textarea
                id="rules"
                name="rules"
                value={form.rules}
                onChange={handleChange}
                placeholder="Enter tournament rules"
              />
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Enter notes"
              />
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => navigate("/tournaments")}
              disabled={saving}
            >
              Cancel
            </button>

            <button type="submit" className={styles.saveBtn} disabled={saving}>
              {saving
                ? isEdit
                  ? "Updating..."
                  : "Saving..."
                : isEdit
                ? "Update Tournament"
                : "Save Tournament"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}