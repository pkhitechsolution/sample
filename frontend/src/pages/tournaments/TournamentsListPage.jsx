import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./Tournaments.module.css";
import {
  getAllTournaments,
  deleteTournament,
  getTournamentSummary,
  downloadTournamentTemplate,
  uploadTournamentExcel,
  exportTournamentExcel,
  exportTournamentPdf,
} from "../../api/tournaments";

const PAGE_SIZE = 10;

function getRowsFromResponse(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.results)) return response.data.results;
  return [];
}

function getSummaryData(response) {
  return response || {};
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

function normalizeStatus(status) {
  return String(status || "").trim().toLowerCase();
}

function formatTournamentType(ageGroup, genderCategory) {
  const age = String(ageGroup || "").trim();
  const gender = String(genderCategory || "").trim();
  if (!age && !gender) return "-";
  if (!age) return gender;
  if (!gender) return age;
  return `${age} • ${gender}`;
}

function formatTeamsCount(current, max) {
  return `${Number(current || 0)} / ${Number(max || 0)}`;
}

function formatTournamentFormat(value) {
  return String(value || "-")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatStatus(value) {
  return String(value || "-")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getStatusClass(status) {
  const value = normalizeStatus(status);

  if (value === "draft") return styles.statusDraft;
  if (value === "open" || value === "upcoming") return styles.statusOpen;
  if (value === "scheduled") return styles.statusScheduled;
  if (value === "ongoing") return styles.statusOngoing;
  if (value === "completed") return styles.statusCompleted;
  if (value === "cancelled" || value === "canceled") {
    return styles.statusCancelled;
  }

  return styles.statusDraft;
}

export default function TournamentsListPage() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [sportFilter, setSportFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [formatFilter, setFormatFilter] = useState("");

  const [selectedIds, setSelectedIds] = useState([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fileInputRef = useRef(null);
  const exportMenuRef = useRef(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [listRes, summaryRes] = await Promise.allSettled([
        getAllTournaments(),
        getTournamentSummary(),
      ]);

      if (listRes.status === "fulfilled") {
        setRows(getRowsFromResponse(listRes.value));
      } else {
        console.error("Failed to load tournaments:", listRes.reason);
        setRows([]);
        setError("Failed to load tournaments.");
      }

      if (summaryRes.status === "fulfilled") {
        setSummary(getSummaryData(summaryRes.value));
      } else {
        console.error("Failed to load tournament summary:", summaryRes.reason);
        setSummary({});
      }
    } catch (err) {
      console.error("Tournament load error:", err);
      setRows([]);
      setSummary({});
      setError("Failed to load tournaments.");
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
      const name = String(item?.name || "").toLowerCase();
      const sport = String(item?.sport || "").toLowerCase();
      const format = String(item?.format || "").toLowerCase();
      const venue = String(item?.venue || "").toLowerCase();
      const organizer = String(item?.organizer || "").toLowerCase();
      const status = String(item?.status || "").toLowerCase();
      const ageGroup = String(item?.age_group || "").toLowerCase();
      const genderCategory = String(item?.gender_category || "").toLowerCase();

      const matchesSearch =
        !q ||
        name.includes(q) ||
        sport.includes(q) ||
        format.includes(q) ||
        venue.includes(q) ||
        organizer.includes(q) ||
        status.includes(q) ||
        ageGroup.includes(q) ||
        genderCategory.includes(q);

      const matchesSport = !sportFilter || sport === sportFilter.toLowerCase();
      const matchesStatus =
        !statusFilter || status === statusFilter.toLowerCase();
      const matchesFormat =
        !formatFilter || format === formatFilter.toLowerCase();

      return matchesSearch && matchesSport && matchesStatus && matchesFormat;
    });
  }, [rows, search, sportFilter, statusFilter, formatFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sportFilter, statusFilter, formatFilter]);

  const allSports = useMemo(
    () => [...new Set(rows.map((item) => item?.sport).filter(Boolean))],
    [rows]
  );

  const allStatuses = useMemo(
    () => [...new Set(rows.map((item) => item?.status).filter(Boolean))],
    [rows]
  );

  const allFormats = useMemo(
    () => [...new Set(rows.map((item) => item?.format).filter(Boolean))],
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
      alert("Please select exactly one tournament to edit.");
      return;
    }
    navigate(`/tournaments/edit/${selectedIds[0]}`);
  };

  const handleDeleteSelected = async () => {
    if (!selectedIds.length) {
      alert("Please select at least one tournament.");
      return;
    }

    const ok = window.confirm(
      `Are you sure you want to delete ${selectedIds.length} selected tournament${
        selectedIds.length > 1 ? "s" : ""
      }?`
    );
    if (!ok) return;

    try {
      setActionLoading(true);
      await Promise.all(selectedIds.map((id) => deleteTournament(id)));
      setSelectedIds([]);
      await loadData();
    } catch (err) {
      console.error("Bulk delete failed:", err);
      alert("Failed to delete selected tournaments.");
    } finally {
      setActionLoading(false);
    }
  };

  const downloadBlobFile = (response, fallbackFilename) => {
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
  };

  const handleTemplateDownload = async () => {
    try {
      setActionLoading(true);
      const response = await downloadTournamentTemplate();
      downloadBlobFile(response, "tournaments_template.xlsx");
      setShowExportMenu(false);
    } catch (err) {
      console.error("Template download failed:", err);
      alert("Template download failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleExcelExport = async () => {
    try {
      setActionLoading(true);
      const response = await exportTournamentExcel();
      downloadBlobFile(response, "tournaments_export.xlsx");
      setShowExportMenu(false);
    } catch (err) {
      console.error("Excel export failed:", err);
      alert("Excel export failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePdfExport = async () => {
    try {
      setActionLoading(true);
      const response = await exportTournamentPdf();
      downloadBlobFile(response, "tournaments_report.pdf");
      setShowExportMenu(false);
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("PDF export failed.");
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

      const data = await uploadTournamentExcel(formData);

      const skippedRows = Array.isArray(data?.skipped_rows)
        ? data.skipped_rows
        : [];

      const messageLines = [
        data?.detail || "Tournament Excel uploaded successfully.",
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
    } catch (err) {
      console.error("Upload failed:", err);
      const message =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Tournament Excel upload failed.";
      alert(message);
    } finally {
      event.target.value = "";
      setActionLoading(false);
    }
  };

  const totalTournaments = summary?.total_tournaments ?? rows.length ?? 0;
  const draftCount =
    summary?.draft_count ??
    rows.filter((item) => normalizeStatus(item?.status) === "draft").length;
  const ongoingCount =
    summary?.ongoing_count ??
    rows.filter((item) => normalizeStatus(item?.status) === "ongoing").length;
  const completedCount =
    summary?.completed_count ??
    rows.filter((item) => normalizeStatus(item?.status) === "completed").length;
  const openCount =
    summary?.open_count ??
    rows.filter((item) =>
      ["open", "upcoming"].includes(normalizeStatus(item?.status))
    ).length;

  return (
    <div className={styles.page}>
      <div className={styles.heroCard}>
        <div className={styles.heroBadge}>SPORTS TALENT MANAGEMENT</div>
        <h1 className={styles.heroTitle}>Tournaments Management</h1>
        <p className={styles.heroSubtitle}>
          Create, manage, and monitor tournament profiles with a compact professional layout.
        </p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>TOTAL TOURNAMENTS</div>
          <div className={styles.statValue}>{totalTournaments}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>DRAFT</div>
          <div className={styles.statValue}>{draftCount}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>OPEN</div>
          <div className={styles.statValue}>{openCount}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>ONGOING</div>
          <div className={styles.statValue}>{ongoingCount}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>COMPLETED</div>
          <div className={styles.statValue}>{completedCount}</div>
        </div>
      </div>

      <div className={styles.sectionCard}>
        <div className={styles.sectionTop}>
          <div className={styles.sectionTitleWrap}>
            <h2 className={styles.sectionTitle}>Tournaments List</h2>
            <p className={styles.sectionSubtitle}>
              Search, filter, edit, and maintain tournament records.
            </p>
          </div>

          <div className={styles.topActions}>
            <Link to="/tournaments/add" className={styles.primaryBtn}>
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
              Select one or more tournaments to use common actions above.
            </div>
          )}
        </div>

        <div className={styles.filtersRow}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by tournament, sport, venue, organizer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className={styles.filterSelect}
            value={sportFilter}
            onChange={(e) => setSportFilter(e.target.value)}
          >
            <option value="">All Sports</option>
            {allSports.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

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
                {formatTournamentFormat(item)}
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
                  <th>TOURNAMENT</th>
                  <th>SPORT</th>
                  <th>FORMAT</th>
                  <th>STATUS</th>
                  <th>VENUE</th>
                  <th>ORGANIZER</th>
                  <th>START DATE</th>
                  <th>END DATE</th>
                  <th>TEAMS</th>
                  <th>MATCHES</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="12" className={styles.emptyRow}>
                      Loading tournaments...
                    </td>
                  </tr>
                ) : paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan="12" className={styles.emptyRow}>
                      No tournament records found.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((item, index) => {
                    const isSelected = selectedIds.includes(item.id);

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
                          <div className={styles.nameText}>
                            {item?.name || "-"}
                          </div>
                          <div className={styles.subText}>
                            {formatTournamentType(
                              item?.age_group,
                              item?.gender_category
                            )}
                          </div>
                        </td>

                        <td>{item?.sport || "-"}</td>

                        <td>{formatTournamentFormat(item?.format)}</td>

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
                        <td>{item?.organizer || "-"}</td>
                        <td>{formatDate(item?.start_date)}</td>
                        <td>{formatDate(item?.end_date)}</td>
                        <td className={styles.countText}>
                          {formatTeamsCount(item?.teams_count, item?.max_teams)}
                        </td>
                        <td>{Number(item?.matches_count || 0)}</td>
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