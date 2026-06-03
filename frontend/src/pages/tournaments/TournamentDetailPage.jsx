import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  generateTournamentFixtures,
  getTournamentById,
  getTournamentTeams,
} from "../../api/tournaments";
import styles from "./TournamentDetailPage.module.css";

const formatText = (value) => {
  if (!value) return "-";
  return String(value)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

export default function TournamentDetailPage() {
  const { id } = useParams();

  const [tournament, setTournament] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [tournamentData, teamsData] = await Promise.all([
        getTournamentById(id),
        getTournamentTeams(id),
      ]);

      setTournament(tournamentData);
      setTeams(Array.isArray(teamsData) ? teamsData : teamsData?.results || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load tournament details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleGenerateFixtures = async () => {
    try {
      setGenerating(true);
      await generateTournamentFixtures(id);
      alert("Fixtures generated successfully.");
      await fetchData();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.detail || "Failed to generate fixtures.");
    } finally {
      setGenerating(false);
    }
  };

  const durationDays = useMemo(() => {
    if (!tournament?.start_date || !tournament?.end_date) return 0;
    const start = new Date(tournament.start_date);
    const end = new Date(tournament.end_date);
    const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? diff + 1 : 0;
  }, [tournament]);

  if (loading) {
    return <div className={styles.loading}>Loading tournament details...</div>;
  }

  if (error) {
    return <div className={styles.errorBox}>{error}</div>;
  }

  if (!tournament) {
    return <div className={styles.errorBox}>Tournament not found.</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>{tournament.name}</h1>
          <p className={styles.subtitle}>
            {tournament.sport} • {formatText(tournament.format)} • {tournament.status}
          </p>
        </div>

        <div className={styles.headerActions}>
          <Link
            to={`/tournaments/edit/${tournament.id}`}
            className={styles.secondaryBtn}
          >
            Edit
          </Link>
          <Link
            to={`/tournaments/${tournament.id}/fixtures`}
            className={styles.primaryBtn}
          >
            View Fixtures
          </Link>
        </div>
      </div>

      <div className={styles.infoGrid}>
        <div className={styles.card}>
          <span>Sport</span>
          <strong>{tournament.sport || "-"}</strong>
        </div>
        <div className={styles.card}>
          <span>Format</span>
          <strong>{formatText(tournament.format)}</strong>
        </div>
        <div className={styles.card}>
          <span>Age Group</span>
          <strong>{tournament.age_group || "-"}</strong>
        </div>
        <div className={styles.card}>
          <span>Gender Category</span>
          <strong>{tournament.gender_category || "-"}</strong>
        </div>
        <div className={styles.card}>
          <span>Venue</span>
          <strong>{tournament.venue || "-"}</strong>
        </div>
        <div className={styles.card}>
          <span>Organizer</span>
          <strong>{tournament.organizer || "-"}</strong>
        </div>
        <div className={styles.card}>
          <span>Contact Person</span>
          <strong>{tournament.contact_person || "-"}</strong>
        </div>
        <div className={styles.card}>
          <span>Contact Phone</span>
          <strong>{tournament.contact_phone || "-"}</strong>
        </div>
        <div className={styles.card}>
          <span>Start Date</span>
          <strong>{tournament.start_date || "-"}</strong>
        </div>
        <div className={styles.card}>
          <span>End Date</span>
          <strong>{tournament.end_date || "-"}</strong>
        </div>
        <div className={styles.card}>
          <span>Registration Last Date</span>
          <strong>{tournament.registration_last_date || "-"}</strong>
        </div>
        <div className={styles.card}>
          <span>Duration</span>
          <strong>{durationDays} days</strong>
        </div>
        <div className={styles.card}>
          <span>Teams</span>
          <strong>
            {tournament.teams_count || 0} / {tournament.max_teams || 0}
          </strong>
        </div>
        <div className={styles.card}>
          <span>Matches</span>
          <strong>{tournament.matches_count || 0}</strong>
        </div>
        <div className={styles.card}>
          <span>Vacancies</span>
          <strong>{tournament.vacancies || 0}</strong>
        </div>
        <div className={styles.card}>
          <span>Fill %</span>
          <strong>{tournament.fill_percentage || 0}%</strong>
        </div>
      </div>

      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h2>Description</h2>
        </div>
        <p className={styles.description}>
          {tournament.description || "No description available."}
        </p>
      </div>

      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h2>Rules</h2>
        </div>
        <p className={styles.description}>
          {tournament.rules || "No rules available."}
        </p>
      </div>

      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h2>Notes</h2>
        </div>
        <p className={styles.description}>
          {tournament.notes || "No notes available."}
        </p>
      </div>

      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h2>Registered Teams</h2>
          <button
            className={styles.primaryBtn}
            onClick={handleGenerateFixtures}
            disabled={generating}
          >
            {generating ? "Generating..." : "Generate Fixtures"}
          </button>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Team</th>
                <th>Seed No</th>
                <th>Group</th>
                <th>Registered On</th>
              </tr>
            </thead>
            <tbody>
              {teams.length === 0 ? (
                <tr>
                  <td colSpan="5" className={styles.emptyCell}>
                    No teams registered.
                  </td>
                </tr>
              ) : (
                teams.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>{item.team_name || item.team?.team_name || "-"}</td>
                    <td>{item.seed_no || "-"}</td>
                    <td>{item.group_name || "-"}</td>
                    <td>
                      {item.registered_on
                        ? new Date(item.registered_on).toLocaleString()
                        : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}