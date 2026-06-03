import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./Matches.module.css";
import {
  getMatches,
  deleteMatch,
  uploadMatchesExcel,
  downloadMatchesTemplate,
  exportMatchesExcel,
  exportMatchesPdf,
} from "../../api/matches";

const PAGE_SIZE = 10;

function getRowsFromResponse(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.results)) return response.data.results;
  return [];
}

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;

  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMatchType(value) {
  return String(value || "-")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatStatus(value) {
  return String(value || "-")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeStatus(status) {
  return String(status || "").trim().toLowerCase();
}

function getStatusClass(status) {
  const value = normalizeStatus(status);

  if (value === "scheduled") return styles.statusScheduled;
  if (value === "ongoing" || value === "live") return styles.statusOngoing;
  if (value === "completed") return styles.statusCompleted;
  if (value === "cancelled" || value === "canceled" || value === "postponed") {
    return styles.statusCancelled;
  }

  return styles.statusScheduled;
}

function getFormatClass(format) {
  const value = String(format || "").trim().toLowerCase();

  if (value === "league") return styles.formatLeague;
  if (value === "knockout") return styles.formatKnockout;
  if (value === "friendly") return styles.formatFriendly;
  return styles.formatNeutral;
}

function downloadBlobFile(response, fallbackFilename) {
  let blob;

  if (response?.data instanceof Blob) {
    blob = response.data;
  } else if (response instanceof Blob) {
    blob = response;
  } else if (response?.data) {
    blob = new Blob([response.data]);
  } else {
    throw new Error("No file data received.");
  }

  const disposition =
    response?.headers?.["content-disposition"] ||
    response?.headers?.["Content-Disposition"] ||
    "";

  const match = disposition.match(/filename="?([^"]+)"?/i);
  const fileName = match?.[1] || fallbackFilename;

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export default function MatchesListPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const exportMenuRef = useRef(null);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [formatFilter, setFormatFilter] = useState("");
  const [venueFilter, setVenueFilter] = useState("");

  const [selectedIds, setSelectedIds] = useState([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getMatches();
      setRows(getRowsFromResponse(response));
    } catch (error) {
      console.error("Matches load error:", error);
      setRows([]);
      setError("Failed to load matches.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target)
      ) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();

    return rows.filter((item) => {
      const title = String(item?.title || item?.match_title || "").toLowerCase();
      const tournament = String(
        item?.tournament_name || item?.tournament?.name || item?.tournament || ""
      ).toLowerCase();
      const teamA = String(
        item?.team_a_name || item?.team_a?.name || item?.team_a || ""
      ).toLowerCase();
      const teamB = String(
        item?.team_b_name || item?.team_b?.name || item?.team_b || ""
      ).toLowerCase();
      const venue = String(item?.venue || "").toLowerCase();
      const status = String(item?.status || "").toLowerCase();
      const format = String(
        item?.match_format || item?.format || item?.match_type || ""
      ).toLowerCase();
      const referee = String(item?.referee_name || "").toLowerCase();
      const sport = String(item?.sport_name || item?.sport || "").toLowerCase();

      const matchesSearch =
        !q ||
        title.includes(q) ||
        tournament.includes(q) ||
        teamA.includes(q) ||
        teamB.includes(q) ||
        venue.includes(q) ||
        status.includes(q) ||
        format.includes(q) ||
        referee.includes(q) ||
        sport.includes(q);

      const matchesStatus =
        !statusFilter || status === statusFilter.toLowerCase();

      const matchesFormat =
        !formatFilter || format === formatFilter.toLowerCase();

      const matchesVenue =
        !venueFilter || venue === venueFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesFormat && matchesVenue;
    });
  }, [rows, search, statusFilter, formatFilter, venueFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, formatFilter, venueFilter]);

  const allStatuses = useMemo(
    () => [...new Set(rows.map((item) => item?.status).filter(Boolean))],
    [rows]
  );

  const allFormats = useMemo(
    () =>
      [
        ...new Set(
          rows
            .map((item) => item?.match_format || item?.format || item?.match_type)
            .filter(Boolean)
        ),
      ],
    [rows]
  );

  const allVenues = useMemo(
    () => [...new Set(rows.map((item) => item?.venue).filter(Boolean))],
    [rows]
  );

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
  const paginatedRows = filteredRows.slice(startIndex, startIndex + PAGE_SIZE);

  const allSelectedOnPage =
    paginatedRows.length > 0 &&
    paginatedRows.every((item) => selectedIds.includes(item.id));

  const toggleSelectAllOnPage = () => {
    if (allSelectedOnPage) {
      setSelectedIds((prev) =>
        prev.filter((id) => !paginatedRows.some((row) => row.id === id))
      );
    } else {
      const ids = paginatedRows.map((item) => item.id);
      setSelectedIds((prev) => [...new Set([...prev, ...ids])]);
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleRowClick = (event, id) => {
    const target = event.target;
    const isInteractive = target.closest(
      "button, a, input, select, textarea, label"
    );
    if (isInteractive) return;
    toggleSelectOne(id);
  };

  const handleBulkEdit = () => {
    if (selectedIds.length !== 1) {
      alert("Please select exactly one match to edit.");
      return;
    }
    navigate(`/matches/edit/${selectedIds[0]}`);
  };

  const handleDeleteSelected = async () => {
    if (!selectedIds.length) {
      alert("Please select at least one match.");
      return;
    }

    const ok = window.confirm(
      `Are you sure you want to delete ${selectedIds.length} selected match${
        selectedIds.length > 1 ? "es" : ""
      }?`
    );
    if (!ok) return;

    try {
      setActionLoading(true);
      await Promise.all(selectedIds.map((id) => deleteMatch(id)));
      setSelectedIds([]);
      await loadData();
    } catch (error) {
      console.error("Bulk delete failed:", error);
      alert("Failed to delete selected matches.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
    setShowExportMenu(false);
  };

  const handleExcelUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setActionLoading(true);

      const formData = new FormData();
      formData.append("file", file);

      const data = await uploadMatchesExcel(formData);

      const skippedRows = Array.isArray(data?.skipped_rows)
        ? data.skipped_rows
        : [];

      const messageLines = [
        data?.detail || "Matches Excel uploaded successfully.",
        `Created: ${data?.created_count || 0}`,
      ];

      if (typeof data?.updated_count !== "undefined") {
        messageLines.push(`Updated: ${data?.updated_count || 0}`);
      }

      if (typeof data?.skipped_count !== "undefined") {
        messageLines.push(`Skipped: ${data?.skipped_count || 0}`);
      } else if (skippedRows.length) {
        messageLines.push(`Skipped: ${skippedRows.length}`);
      }

      await loadData();
      alert(messageLines.join("\n"));
    } catch (error) {
      console.error("Upload failed:", error);
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        "Matches Excel upload failed.";
      alert(message);
    } finally {
      event.target.value = "";
      setActionLoading(false);
    }
  };

  const handleTemplateDownload = async () => {
    try {
      setActionLoading(true);
      const response = await downloadMatchesTemplate();
      downloadBlobFile(response, "matches_template.xlsx");
      setShowExportMenu(false);
    } catch (error) {
      console.error("Template download failed:", error);
      alert("Template download failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleExcelExport = async () => {
    try {
      setActionLoading(true);
      const response = await exportMatchesExcel();
      downloadBlobFile(response, "matches_export.xlsx");
      setShowExportMenu(false);
    } catch (error) {
      console.error("Excel export failed:", error);
      alert("Excel export failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePdfExport = async () => {
    try {
      setActionLoading(true);
      const response = await exportMatchesPdf();
      downloadBlobFile(response, "matches_report.pdf");
      setShowExportMenu(false);
    } catch (error) {
      console.error("PDF export failed:", error);
      alert("PDF export failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const totalMatches = rows.length;
  const scheduledCount = rows.filter(
    (item) => normalizeStatus(item?.status) === "scheduled"
  ).length;
  const ongoingCount = rows.filter((item) =>
    ["ongoing", "live"].includes(normalizeStatus(item?.status))
  ).length;
  const completedCount = rows.filter(
    (item) => normalizeStatus(item?.status) === "completed"
  ).length;
  const cancelledCount = rows.filter((item) =>
    ["cancelled", "canceled", "postponed"].includes(normalizeStatus(item?.status))
  ).length;

  return (
    <div className={styles.page}>
      <div className={styles.heroCard}>
        <div className={styles.heroBadge}>SPORTS TALENT MANAGEMENT</div>
        <h1 className={styles.heroTitle}>Matches Management</h1>
        <p className={styles.heroSubtitle}>
          Create, manage, and monitor match fixtures with the same compact
          professional layout used in the Tournaments module.
        </p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>TOTAL MATCHES</div>
          <div className={styles.statValue}>{totalMatches}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>SCHEDULED</div>
          <div className={styles.statValue}>{scheduledCount}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>ONGOING</div>
          <div className={styles.statValue}>{ongoingCount}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>COMPLETED</div>
          <div className={styles.statValue}>{completedCount}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>CANCELLED</div>
          <div className={styles.statValue}>{cancelledCount}</div>
        </div>
      </div>

      <div className={styles.sectionCard}>
        <div className={styles.sectionTop}>
          <div className={styles.sectionTitleWrap}>
            <h2 className={styles.sectionTitle}>Matches List</h2>
            <p className={styles.sectionSubtitle}>
              Search, filter, edit, and maintain match records.
            </p>
          </div>

          <div className={styles.topActions}>
            <Link to="/matches/add" className={styles.primaryBtn}>
              Add New
            </Link>

            <div className={styles.dropdownWrap} ref={exportMenuRef}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => setShowExportMenu((prev) => !prev)}
              >
                Upload / Export <span className={styles.dropdownArrow}>▼</span>
              </button>

              {showExportMenu ? (
                <div className={styles.dropdownMenu}>
                  <button
                    type="button"
                    className={styles.dropdownItem}
                    onClick={handleUploadClick}
                  >
                    Upload Excel
                  </button>
                  <button
                    type="button"
                    className={styles.dropdownItem}
                    onClick={handleTemplateDownload}
                  >
                    Download Template
                  </button>
                  <button
                    type="button"
                    className={styles.dropdownItem}
                    onClick={handleExcelExport}
                  >
                    Download Excel
                  </button>
                  <button
                    type="button"
                    className={styles.dropdownItem}
                    onClick={handlePdfExport}
                  >
                    Download PDF
                  </button>
                </div>
              ) : null}

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className={styles.hiddenFileInput}
                onChange={handleExcelUpload}
              />
            </div>

            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={loadData}
              disabled={loading || actionLoading}
            >
              Reload
            </button>
          </div>
        </div>

        <div className={styles.bulkBarWrap}>
          {selectedIds.length > 0 ? (
            <div className={styles.bulkBar}>
              <div className={styles.bulkLeft}>
                <span className={styles.bulkCount}>
                  {selectedIds.length} selected
                </span>
              </div>

              <div className={styles.bulkActions}>
                <button
                  type="button"
                  className={styles.bulkEditBtn}
                  onClick={handleBulkEdit}
                  disabled={selectedIds.length !== 1 || actionLoading}
                >
                  Edit
                </button>

                <button
                  type="button"
                  className={styles.bulkDeleteBtn}
                  onClick={handleDeleteSelected}
                  disabled={actionLoading}
                >
                  Delete
                </button>

                <button
                  type="button"
                  className={styles.bulkClearBtn}
                  onClick={() => setSelectedIds([])}
                  disabled={actionLoading}
                >
                  Clear
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.bulkBarIdle}>
              Select one or more matches to use common actions above.
            </div>
          )}
        </div>

        <div className={styles.filtersRow}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by title, tournament, team, venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            {allStatuses.map((item) => (
              <option key={item} value={item}>
                {formatStatus(item)}
              </option>
            ))}
          </select>

          <select
            className={styles.filterSelect}
            value={formatFilter}
            onChange={(e) => setFormatFilter(e.target.value)}
          >
            <option value="">All Formats</option>
            {allFormats.map((item) => (
              <option key={item} value={item}>
                {formatMatchType(item)}
              </option>
            ))}
          </select>

          <select
            className={styles.filterSelect}
            value={venueFilter}
            onChange={(e) => setVenueFilter(e.target.value)}
          >
            <option value="">All Venues</option>
            {allVenues.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {error ? <div className={styles.errorBox}>{error}</div> : null}

        <div className={styles.tableCard}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.checkboxHead}>
                    <input
                      type="checkbox"
                      checked={allSelectedOnPage}
                      onChange={toggleSelectAllOnPage}
                    />
                  </th>
                  <th>S.NO</th>
                  <th>MATCH</th>
                  <th>TOURNAMENT</th>
                  <th>SPORT</th>
                  <th>TEAMS</th>
                  <th>FORMAT</th>
                  <th>STATUS</th>
                  <th>VENUE</th>
                  <th>DATE</th>
                  <th>TIME</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="11" className={styles.emptyRow}>
                      Loading matches...
                    </td>
                  </tr>
                ) : paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan="11" className={styles.emptyRow}>
                      No match records found.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((item, index) => {
                    const isSelected = selectedIds.includes(item.id);

                    const title = item?.title || item?.match_title || "-";
                    const tournament =
                      item?.tournament_name ||
                      item?.tournament?.name ||
                      item?.tournament ||
                      "-";
                    const sport = item?.sport_name || item?.sport || "-";
                    const teamA =
                      item?.team_a_name || item?.team_a?.name || item?.team_a || "-";
                    const teamB =
                      item?.team_b_name || item?.team_b?.name || item?.team_b || "-";
                    const matchType =
                      item?.match_format || item?.format || item?.match_type || "-";

                    return (
                      <tr
                        key={item.id}
                        className={isSelected ? styles.selectedRow : ""}
                        onClick={(event) => handleRowClick(event, item.id)}
                      >
                        <td className={styles.checkboxCell}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(item.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>

                        <td className={styles.serialCell}>
                          {startIndex + index + 1}
                        </td>

                        <td>
                          <div className={styles.nameText}>{title}</div>
                          <div className={styles.subText}>
                            {item?.round_name || item?.referee_name || "-"}
                          </div>
                        </td>

                        <td>{tournament}</td>
                        <td>{sport}</td>

                        <td className={styles.teamsText}>
                          {teamA} vs {teamB}
                        </td>

                        <td>
                          <span className={getFormatClass(matchType)}>
                            {formatMatchType(matchType)}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`${styles.statusBadge} ${getStatusClass(
                              item?.status
                            )}`}
                          >
                            {formatStatus(item?.status)}
                          </span>
                        </td>

                        <td>{item?.venue || "-"}</td>
                        <td>{formatDate(item?.match_date || item?.date)}</td>
                        <td>
                          {item?.match_time
                            ? String(item.match_time).slice(0, 5)
                            : "-"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.paginationBar}>
          <button
            type="button"
            className={styles.paginationBtn}
            disabled={safeCurrentPage <= 1}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          >
            Previous
          </button>

          <div className={styles.pageIndicator}>
            Page {safeCurrentPage} of {totalPages}
          </div>

          <button
            type="button"
            className={styles.paginationBtn}
            disabled={safeCurrentPage >= totalPages}
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}