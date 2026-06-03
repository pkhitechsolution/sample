import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./MatchesFormPage.module.css";
import {
  createMatch,
  updateMatch,
  getMatchById,
} from "../../api/matches";

const initialForm = {
  title: "",
  tournament_name: "",
  sport_name: "",
  team_a: "",
  team_b: "",
  venue: "",
  match_date: "",
  match_time: "",
  match_type: "league",
  status: "scheduled",
  round_name: "",
  referee_name: "",
  score_team_a: 0,
  score_team_b: 0,
  winner: "",
  notes: "",
};

const todayValue = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export default function MatchesFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    ...initialForm,
    match_date: todayValue(),
  });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;

    const loadMatch = async () => {
      try {
        setLoading(true);

        const data = await getMatchById(id);

        setForm({
          title: data?.title || "",
          tournament_name: data?.tournament_name || "",
          sport_name: data?.sport_name || "",
          team_a: data?.team_a || "",
          team_b: data?.team_b || "",
          venue: data?.venue || "",
          match_date: data?.match_date || todayValue(),
          match_time: data?.match_time || "",
          match_type: String(data?.match_type || "league").toLowerCase(),
          status: String(data?.status || "scheduled").toLowerCase(),
          round_name: data?.round_name || "",
          referee_name: data?.referee_name || "",
          score_team_a: data?.score_team_a ?? 0,
          score_team_b: data?.score_team_b ?? 0,
          winner: data?.winner || "",
          notes: data?.notes || "",
        });
      } catch (error) {
        console.error("Failed to load match:", error);
        const message =
          error?.response?.data?.detail || "Failed to load match details.";
        alert(message);
      } finally {
        setLoading(false);
      }
    };

    loadMatch();
  }, [id, isEdit]);

  const pageTitle = useMemo(
    () => (isEdit ? "Edit Match Details" : "Match Details"),
    [isEdit]
  );

  const pageSubtitle = useMemo(
    () =>
      isEdit
        ? "Update the required fields carefully and save the match profile."
        : "Fill in the required fields carefully and save the match profile.",
    [isEdit]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "score_team_a" || name === "score_team_b"
          ? value === ""
            ? ""
            : Number(value)
          : value,
    }));
  };

  const validateForm = () => {
    if (!form.title.trim()) {
      alert("Match title is required.");
      return false;
    }

    if (!form.sport_name.trim()) {
      alert("Sport name is required.");
      return false;
    }

    if (!form.team_a.trim()) {
      alert("Team A is required.");
      return false;
    }

    if (!form.team_b.trim()) {
      alert("Team B is required.");
      return false;
    }

    if (!form.match_date) {
      alert("Match date is required.");
      return false;
    }

    if (!form.match_type) {
      alert("Match type is required.");
      return false;
    }

    if (!form.status) {
      alert("Status is required.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const payload = {
      title: form.title.trim(),
      tournament_name: form.tournament_name.trim(),
      sport_name: form.sport_name.trim(),
      team_a: form.team_a.trim(),
      team_b: form.team_b.trim(),
      venue: form.venue.trim(),
      match_date: form.match_date,
      match_time: form.match_time || null,
      match_type: form.match_type,
      status: form.status,
      round_name: form.round_name.trim(),
      referee_name: form.referee_name.trim(),
      score_team_a: Number(form.score_team_a || 0),
      score_team_b: Number(form.score_team_b || 0),
      winner: form.winner.trim(),
      notes: form.notes.trim(),
    };

    try {
      setSaving(true);

      if (isEdit) {
        await updateMatch(id, payload);
        alert("Match updated successfully.");
      } else {
        await createMatch(payload);
        alert("Match created successfully.");
      }

      navigate("/matches");
    } catch (error) {
      console.error("Save failed:", error);

      const data = error?.response?.data;

      if (data?.title?.[0]) {
        alert(`Title: ${data.title[0]}`);
      } else if (data?.sport_name?.[0]) {
        alert(`Sport Name: ${data.sport_name[0]}`);
      } else if (data?.team_a?.[0]) {
        alert(`Team A: ${data.team_a[0]}`);
      } else if (data?.team_b?.[0]) {
        alert(`Team B: ${data.team_b[0]}`);
      } else if (data?.match_date?.[0]) {
        alert(`Match Date: ${data.match_date[0]}`);
      } else if (data?.match_type?.[0]) {
        alert(`Match Type: ${data.match_type[0]}`);
      } else if (data?.status?.[0]) {
        alert(`Status: ${data.status[0]}`);
      } else if (data?.detail) {
        alert(data.detail);
      } else {
        alert("Failed to save match.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingCard}>Loading match details...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.formShell}>
        <form className={styles.formCard} onSubmit={handleSubmit}>
          <div className={styles.formHeader}>
            <h1 className={styles.formTitle}>{pageTitle}</h1>
            <p className={styles.formText}>{pageSubtitle}</p>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="title">Match Title</label>
              <input
                id="title"
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Enter match title"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="sport_name">Sport</label>
              <input
                id="sport_name"
                type="text"
                name="sport_name"
                value={form.sport_name}
                onChange={handleChange}
                placeholder="Enter sport"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="tournament_name">Tournament Name</label>
              <input
                id="tournament_name"
                type="text"
                name="tournament_name"
                value={form.tournament_name}
                onChange={handleChange}
                placeholder="Enter tournament name"
              />
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
              <label htmlFor="team_a">Team A</label>
              <input
                id="team_a"
                type="text"
                name="team_a"
                value={form.team_a}
                onChange={handleChange}
                placeholder="Enter Team A"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="team_b">Team B</label>
              <input
                id="team_b"
                type="text"
                name="team_b"
                value={form.team_b}
                onChange={handleChange}
                placeholder="Enter Team B"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="match_type">Format</label>
              <select
                id="match_type"
                name="match_type"
                value={form.match_type}
                onChange={handleChange}
              >
                <option value="league">League</option>
                <option value="knockout">Knockout</option>
                <option value="friendly">Friendly</option>
                <option value="practice">Practice</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="round_name">Round</label>
              <input
                id="round_name"
                type="text"
                name="round_name"
                value={form.round_name}
                onChange={handleChange}
                placeholder="Quarter Final / Semi Final / Final"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="match_date">Match Date</label>
              <input
                id="match_date"
                type="date"
                name="match_date"
                value={form.match_date}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="match_time">Match Time</label>
              <input
                id="match_time"
                type="time"
                name="match_time"
                value={form.match_time}
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
                <option value="scheduled">Scheduled</option>
                <option value="live">Live</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="postponed">Postponed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="referee_name">Referee Name</label>
              <input
                id="referee_name"
                type="text"
                name="referee_name"
                value={form.referee_name}
                onChange={handleChange}
                placeholder="Enter referee name"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="score_team_a">Score Team A</label>
              <input
                id="score_team_a"
                type="number"
                name="score_team_a"
                value={form.score_team_a}
                onChange={handleChange}
                placeholder="Enter Team A score"
                min="0"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="score_team_b">Score Team B</label>
              <input
                id="score_team_b"
                type="number"
                name="score_team_b"
                value={form.score_team_b}
                onChange={handleChange}
                placeholder="Enter Team B score"
                min="0"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="winner">Winner</label>
              <input
                id="winner"
                type="text"
                name="winner"
                value={form.winner}
                onChange={handleChange}
                placeholder="Enter winner"
              />
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Additional notes"
              />
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => navigate("/matches")}
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
                ? "Update Match"
                : "Save Match"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}