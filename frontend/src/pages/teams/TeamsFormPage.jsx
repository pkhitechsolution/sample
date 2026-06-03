import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./TeamsFormPage.module.css";
import {
  createTeam,
  getTeamById,
  updateTeam,
} from "../../api/teams";

const initialForm = {
  team_name: "",
  sport_name: "",
  age_group: "",
  gender_category: "Mixed",
  coach_name: "",
  captain_name: "",
  vice_captain_name: "",
  max_players: 11,
  current_players_count: 0,
  academic_year: "",
  status: "Active",
  achievements: "",
  notes: "",
};

export default function TeamsFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;

    const loadTeam = async () => {
      try {
        setLoading(true);
        const data = await getTeamById(id);

        setForm({
          ...initialForm,
          ...data,
          max_players: Number(data?.max_players ?? 11),
          current_players_count: Number(data?.current_players_count ?? 0),
          gender_category: data?.gender_category || "Mixed",
          status: data?.status || "Active",
        });
      } catch (error) {
        console.error("Failed to load team:", error);
        alert(error?.response?.data?.detail || "Failed to load team details.");
      } finally {
        setLoading(false);
      }
    };

    loadTeam();
  }, [id, isEdit]);

  const pageTitle = useMemo(
    () => (isEdit ? "Team Details" : "Team Details"),
    [isEdit]
  );

  const pageSubtitle = useMemo(
    () =>
      isEdit
        ? "Update the required fields carefully and save the team profile."
        : "Fill in the required fields carefully and save the team profile.",
    [isEdit]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "max_players" || name === "current_players_count"
          ? value === ""
            ? ""
            : Number(value)
          : value,
    }));
  };

  const validateForm = () => {
    if (!form.team_name.trim()) {
      alert("Team name is required.");
      return false;
    }

    if (!form.sport_name.trim()) {
      alert("Sport name is required.");
      return false;
    }

    if (Number(form.max_players) <= 0) {
      alert("Max players must be greater than 0.");
      return false;
    }

    if (Number(form.current_players_count) < 0) {
      alert("Current players count cannot be negative.");
      return false;
    }

    if (Number(form.current_players_count) > Number(form.max_players)) {
      alert("Current players count cannot exceed max players.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const payload = {
      ...form,
      team_name: form.team_name.trim(),
      sport_name: form.sport_name.trim(),
      age_group: form.age_group.trim(),
      coach_name: form.coach_name.trim(),
      captain_name: form.captain_name.trim(),
      vice_captain_name: form.vice_captain_name.trim(),
      academic_year: form.academic_year.trim(),
      achievements: form.achievements.trim(),
      notes: form.notes.trim(),
      max_players: Number(form.max_players),
      current_players_count: Number(form.current_players_count),
    };

    try {
      setSaving(true);

      if (isEdit) {
        await updateTeam(id, payload);
        alert("Team updated successfully.");
      } else {
        await createTeam(payload);
        alert("Team created successfully.");
      }

      navigate("/teams");
    } catch (error) {
      console.error("Save failed:", error);
      const data = error?.response?.data;

      if (data?.team_name?.[0]) {
        alert(`Team Name: ${data.team_name[0]}`);
      } else if (data?.sport_name?.[0]) {
        alert(`Sport Name: ${data.sport_name[0]}`);
      } else if (data?.max_players?.[0]) {
        alert(`Max Players: ${data.max_players[0]}`);
      } else if (data?.current_players_count?.[0]) {
        alert(`Current Players Count: ${data.current_players_count[0]}`);
      } else if (data?.detail) {
        alert(data.detail);
      } else {
        alert("Failed to save team.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.formCard}>
          <div className={styles.loadingText}>Loading team details...</div>
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
              <label htmlFor="team_name">Team Name</label>
              <input
                id="team_name"
                type="text"
                name="team_name"
                value={form.team_name}
                onChange={handleChange}
                placeholder="Enter team name"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="sport_name">Sport Name</label>
              <input
                id="sport_name"
                type="text"
                name="sport_name"
                value={form.sport_name}
                onChange={handleChange}
                placeholder="Enter sport name"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="age_group">Age Group</label>
              <input
                id="age_group"
                type="text"
                name="age_group"
                value={form.age_group}
                onChange={handleChange}
                placeholder="Under-14 / Under-17 / Senior"
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
              <label htmlFor="coach_name">Coach Name</label>
              <input
                id="coach_name"
                type="text"
                name="coach_name"
                value={form.coach_name}
                onChange={handleChange}
                placeholder="Enter coach name"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="captain_name">Captain Name</label>
              <input
                id="captain_name"
                type="text"
                name="captain_name"
                value={form.captain_name}
                onChange={handleChange}
                placeholder="Enter captain name"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="vice_captain_name">Vice Captain Name</label>
              <input
                id="vice_captain_name"
                type="text"
                name="vice_captain_name"
                value={form.vice_captain_name}
                onChange={handleChange}
                placeholder="Enter vice captain name"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="academic_year">Academic Year</label>
              <input
                id="academic_year"
                type="text"
                name="academic_year"
                value={form.academic_year}
                onChange={handleChange}
                placeholder="2025-2026"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="max_players">Max Players</label>
              <input
                id="max_players"
                type="number"
                name="max_players"
                value={form.max_players}
                onChange={handleChange}
                min="1"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="current_players_count">Current Players Count</label>
              <input
                id="current_players_count"
                type="number"
                name="current_players_count"
                value={form.current_players_count}
                onChange={handleChange}
                min="0"
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
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Archived">Archived</option>
              </select>
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label htmlFor="achievements">Achievements</label>
              <textarea
                id="achievements"
                name="achievements"
                value={form.achievements}
                onChange={handleChange}
                placeholder="Enter achievements"
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
              onClick={() => navigate("/teams")}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className={styles.saveBtn}
              disabled={saving}
            >
              {saving
                ? isEdit
                  ? "Updating..."
                  : "Saving..."
                : isEdit
                ? "Update Team"
                : "Save Team"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}