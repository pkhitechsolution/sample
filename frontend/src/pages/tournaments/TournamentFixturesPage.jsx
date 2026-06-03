import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getTournamentById,
  getTournamentFixtures,
  patchTournamentMatch,
} from "../../api/tournaments";
import styles from "./TournamentFixturesPage.module.css";

export default function TournamentFixturesPage() {
  const { id } = useParams();

  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingMatchId, setSavingMatchId] = useState(null);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [tournamentData, fixturesData] = await Promise.all([
        getTournamentById(id),
        getTournamentFixtures(id),
      ]);

      setTournament(tournamentData);
      setMatches(Array.isArray(fixturesData) ? fixturesData : fixturesData?.results || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load fixtures.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleFieldChange = (matchId, field, value) => {
    setMatches((prev) =>
      prev.map((item) =>
        item.id === matchId ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSaveMatch = async (match) => {
    try {
      setSavingMatchId(match.id);
      await patchTournamentMatch(match.id, {
        match_date: match.match_date,
        match_time: match.match_time,
        venue: match.venue,
        main_official: match.main_official,
        alternate_official: match.alternate_official,
        score_team_a: match.score_team_a,
        score_team_b: match.score_team_b,
        remarks: match.remarks,
        status: match.status,
      });
      alert("Match updated successfully.");
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.detail || "Failed to update match.");
    } finally {
      setSavingMatchId(null);
    }
  };

  if (loading) return <div className={styles.loading}>Loading fixtures...</div>;
  if (error) return <div className={styles.errorBox}>{error}</div>;

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Tournament Fixtures</h1>
          <p className={styles.subtitle}>
            {tournament?.name || "-"} • {tournament?.sport || "-"}
          </p>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Match No</th>
                <th>Round</th>
                <th>Team A</th>
                <th>Team B</th>
                <th>Date</th>
                <th>Time</th>
                <th>Venue</th>
                <th>Main Official</th>
                <th>Alternate Official</th>
                <th>Score A</th>
                <th>Score B</th>
                <th>Status</th>
                <th>Remarks</th>
                <th>Save</th>
              </tr>
            </thead>
            <tbody>
              {matches.length === 0 ? (
                <tr>
                  <td colSpan="15" className={styles.emptyCell}>
                    No fixtures available.
                  </td>
                </tr>
              ) : (
                matches.map((match, index) => (
                  <tr key={match.id}>
                    <td>{index + 1}</td>
                    <td>{match.match_no || "-"}</td>
                    <td>{match.round_name || "-"}</td>
                    <td>{match.team_a_name || match.team_a?.team_name || "TBD"}</td>
                    <td>{match.team_b_name || match.team_b?.team_name || "TBD"}</td>
                    <td>
                      <input
                        type="date"
                        value={match.match_date || ""}
                        onChange={(e) =>
                          handleFieldChange(match.id, "match_date", e.target.value)
                        }
                        className={styles.input}
                      />
                    </td>
                    <td>
                      <input
                        type="time"
                        value={match.match_time || ""}
                        onChange={(e) =>
                          handleFieldChange(match.id, "match_time", e.target.value)
                        }
                        className={styles.input}
                      />
                    </td>
                    <td>
                      <input
                        value={match.venue || ""}
                        onChange={(e) =>
                          handleFieldChange(match.id, "venue", e.target.value)
                        }
                        className={styles.input}
                      />
                    </td>
                    <td>
                      <input
                        value={match.main_official || ""}
                        onChange={(e) =>
                          handleFieldChange(match.id, "main_official", e.target.value)
                        }
                        className={styles.input}
                      />
                    </td>
                    <td>
                      <input
                        value={match.alternate_official || ""}
                        onChange={(e) =>
                          handleFieldChange(
                            match.id,
                            "alternate_official",
                            e.target.value
                          )
                        }
                        className={styles.input}
                      />
                    </td>
                    <td>
                      <input
                        value={match.score_team_a || ""}
                        onChange={(e) =>
                          handleFieldChange(match.id, "score_team_a", e.target.value)
                        }
                        className={styles.input}
                      />
                    </td>
                    <td>
                      <input
                        value={match.score_team_b || ""}
                        onChange={(e) =>
                          handleFieldChange(match.id, "score_team_b", e.target.value)
                        }
                        className={styles.input}
                      />
                    </td>
                    <td>
                      <select
                        value={match.status || "PENDING"}
                        onChange={(e) =>
                          handleFieldChange(match.id, "status", e.target.value)
                        }
                        className={styles.input}
                      >
                        <option value="PENDING">Pending</option>
                        <option value="SCHEDULED">Scheduled</option>
                        <option value="ONGOING">Ongoing</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="RESCHEDULED">Rescheduled</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </td>
                    <td>
                      <input
                        value={match.remarks || ""}
                        onChange={(e) =>
                          handleFieldChange(match.id, "remarks", e.target.value)
                        }
                        className={styles.input}
                      />
                    </td>
                    <td>
                      <button
                        className={styles.saveBtn}
                        onClick={() => handleSaveMatch(match)}
                        disabled={savingMatchId === match.id}
                      >
                        {savingMatchId === match.id ? "Saving..." : "Save"}
                      </button>
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