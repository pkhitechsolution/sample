import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./TeamsListPage.module.css";
import {
  deleteTeam,
  downloadTeamsTemplate,
  exportTeamsExcel,
  exportTeamsPdf,
  getTeams,
  getTeamsSummary,
  uploadTeamsExcel,
} from "../../api/teams";

const PAGE_SIZE = 10;

function getRowsFromResponse(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.results)) return response.data.results;
  return [];
}

function formatPlayers(current, max) {
  return `${Number(current || 0)} / ${Number(max || 0)}`;
}

export default function TeamsListPage() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({
    total_teams: 0,
    active_teams: 0,
    inactive_teams: 0,
    full_teams: 0,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [sportFilter, setSportFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");

  const [selectedIds, setSelectedIds] = useState([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fileInputRef = useRef(null);
  const exportMenuRef = useRef(null);

  const loadData = async () => {
    try {
      setLoading(true);

      const [listRes, summaryRes] = await Promise.allSettled([
        getTeams(),
        getTeamsSummary(),
      ]);

      if (listRes.status === "fulfilled") {
        setRows(getRowsFromResponse(listRes.value));
      } else {
        console.error("Failed to load teams:", listRes.reason);
        setRows([]);
      }

      if (summaryRes.status === "fulfilled") {
        setSummary({
          total_teams: Number(summaryRes.value?.total_teams || 0),
          active_teams: Number(summaryRes.value?.active_teams || 0),
          inactive_teams: Number(summaryRes.value?.inactive_teams || 0),
          full_teams: Number(summaryRes.value?.full_teams || 0),
        });
      } else {
        console.error("Failed to load summary:", summaryRes.reason);
        setSummary({
          total_teams: 0,
          active_teams: 0,
          inactive_teams: 0,
          full_teams: 0,
        });
      }
    } catch (error) {
      console.error("Teams load error:", error);
      setRows([]);
      setSummary({
        total_teams: 0,
        active_teams: 0,
        inactive_teams: 0,
        full_teams: 0,
      });
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
      const teamName = String(item?.team_name || "").toLowerCase();
      const sportName = String(item?.sport_name || "").toLowerCase();
      const ageGroup = String(item?.age_group || "").toLowerCase();
      const coachName = String(item?.coach_name || "").toLowerCase();
      const captainName = String(item?.captain_name || "").toLowerCase();
      const viceCaptainName = String(item?.vice_captain_name || "").toLowerCase();
      const academicYear = String(item?.academic_year || "").toLowerCase();
      const genderCategory = String(item?.gender_category || "").toLowerCase();
      const status = String(item?.status || "").toLowerCase();

      const matchesSearch =
        !q ||
        teamName.includes(q) ||
        sportName.includes(q) ||
        ageGroup.includes(q) ||
        coachName.includes(q) ||
        captainName.includes(q) ||
        viceCaptainName.includes(q) ||
        academicYear.includes(q) ||
        genderCategory.includes(q) ||
        status.includes(q);

      const matchesSport =
        !sportFilter || sportName === sportFilter.toLowerCase();

      const matchesStatus =
        !statusFilter || status === statusFilter.toLowerCase();

      const matchesGender =
        !genderFilter || genderCategory === genderFilter.toLowerCase();

      return matchesSearch && matchesSport && matchesStatus && matchesGender;
    });
  }, [rows, search, sportFilter, statusFilter, genderFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sportFilter, statusFilter, genderFilter]);

  const allSports = useMemo(
    () => [...new Set(rows.map((item) => item?.sport_name).filter(Boolean))],
    [rows]
  );

  const allStatuses = useMemo(
    () => [...new Set(rows.map((item) => item?.status).filter(Boolean))],
    [rows]
  );

  const allGenderCategories = useMemo(
    () => [...new Set(rows.map((item) => item?.gender_category).filter(Boolean))],
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
      'button, a, input, select, textarea, label'
    );
    if (isInteractive) return;
    toggleSelectOne(id);
  };

  const handleDeleteSelected = async () => {
    if (!selectedIds.length) {
      alert("Please select at least one row.");
      return;
    }

    const ok = window.confirm(
      `Are you sure you want to delete ${selectedIds.length} selected team${
        selectedIds.length > 1 ? "s" : ""
      }?`
    );
    if (!ok) return;

    try {
      setActionLoading(true);
      await Promise.all(selectedIds.map((id) => deleteTeam(id)));
      setSelectedIds([]);
      await loadData();
    } catch (error) {
      console.error("Bulk delete failed:", error);
      alert("Failed to delete selected teams.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkEdit = () => {
    if (selectedIds.length !== 1) {
      alert("Please select exactly one row to edit.");
      return;
    }
    navigate(`/teams/edit/${selectedIds[0]}`);
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
      const response = await downloadTeamsTemplate();
      downloadBlobFile(response, "teams_template.xlsx");
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
      const response = await exportTeamsExcel();
      downloadBlobFile(response, "teams_export.xlsx");
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
      const response = await exportTeamsPdf();
      downloadBlobFile(response, "teams_report.pdf");
      setShowExportMenu(false);
    } catch (error) {
      console.error("PDF export failed:", error);
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
      const data = await uploadTeamsExcel(formData);

      const skippedRows = Array.isArray(data?.skipped_rows)
        ? data.skipped_rows
        : [];

      const messageLines = [
        data?.detail || "Excel uploaded successfully.",
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
        "Excel upload failed.";
      alert(message);
    } finally {
      event.target.value = "";
      setActionLoading(false);
    }
  };

  const getStatusClass = (status) => {
    const value = String(status || "").toLowerCase();
    if (value === "active") return styles.statusActive;
    if (value === "inactive") return styles.statusInactive;
    return styles.statusArchived;
  };

  const totalTeams = summary?.total_teams ?? rows.length ?? 0;
  const activeTeams = summary?.active_teams ?? 0;
  const inactiveTeams = summary?.inactive_teams ?? 0;
  const fullTeams = summary?.full_teams ?? 0;

  return (
    <div className={styles.page}>
      <div className={styles.heroCard}>
        <div className={styles.heroBadge}>SPORTS TALENT MANAGEMENT</div>
        <h1 className={styles.heroTitle}>Teams Management</h1>
        <p className={styles.heroSubtitle}>
          Create, manage, and monitor team profiles with a compact professional layout.
        </p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>TOTAL TEAMS</div>
          <div className={styles.statValue}>{totalTeams}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>ACTIVE TEAMS</div>
          <div className={styles.statValue}>{activeTeams}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>INACTIVE TEAMS</div>
          <div className={styles.statValue}>{inactiveTeams}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>FULL TEAMS</div>
          <div className={styles.statValue}>{fullTeams}</div>
        </div>
      </div>

      <div className={styles.sectionCard}>
        <div className={styles.sectionTop}>
          <div className={styles.sectionTitleWrap}>
            <h2 className={styles.sectionTitle}>Teams List</h2>
            <p className={styles.sectionSubtitle}>
              Search, filter, edit, and maintain team records.
            </p>
          </div>

          <div className={styles.topActions}>
            <Link to="/teams/add" className={styles.primaryBtn}>
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
                <span className={styles.bulkCount}>{selectedIds.length} selected</span>
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
              Select one or more teams to use common actions above.
            </div>
          )}
        </div>

        <div className={styles.filtersRow}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by team, sport, coach..."
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
                {item}
              </option>
            ))}
          </select>

          <select
            className={styles.filterSelect}
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {allGenderCategories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

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
                  <th>TEAM</th>
                  <th>SPORT</th>
                  <th>AGE GROUP</th>
                  <th>COACH</th>
                  <th>CAPTAIN</th>
                  <th>PLAYERS</th>
                  <th>STATUS</th>
                  <th>ACADEMIC YEAR</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="10" className={styles.emptyRow}>
                      Loading teams...
                    </td>
                  </tr>
                ) : paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan="10" className={styles.emptyRow}>
                      No team records found.
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
                        <td>{item?.team_name || "-"}</td>
                        <td>{item?.sport_name || "-"}</td>
                        <td>{item?.age_group || "-"}</td>
                        <td>{item?.coach_name || "-"}</td>
                        <td>{item?.captain_name || "-"}</td>
                        <td className={styles.playersText}>
                          {formatPlayers(item?.current_players_count, item?.max_players)}
                        </td>
                        <td>
                          <span
                            className={`${styles.statusBadge} ${getStatusClass(
                              item?.status
                            )}`}
                          >
                            {item?.status || "-"}
                          </span>
                        </td>
                        <td>{item?.academic_year || "-"}</td>
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
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={safeCurrentPage === 1}
          >
            Prev
          </button>

          <div className={styles.pageIndicator}>
            Page {safeCurrentPage} of {totalPages}
          </div>

          <button
            type="button"
            className={styles.paginationBtn}
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={safeCurrentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}