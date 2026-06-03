import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./TalentRegistry.module.css";
import {
  listTalentProfiles,
  deleteTalentProfile,
  getTalentSummary,
  downloadTalentTemplate,
  uploadTalentExcel,
  exportTalentExcel,
  exportTalentPdf,
} from "../../api/talentRegistry";

const PAGE_SIZE = 10;

function getRowsFromResponse(response) {
  const data = response?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function getSummaryData(response) {
  return response?.data || {};
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

function downloadBlobFile(response, fallbackFilename) {
  let blob;

  if (response?.data instanceof Blob) {
    blob = response.data;
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

export default function TalentRegistryListPage() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [selectedIds, setSelectedIds] = useState([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fileInputRef = useRef(null);
  const exportMenuRef = useRef(null);

  const loadData = async () => {
    try {
      setLoading(true);

      const [listRes, summaryRes] = await Promise.allSettled([
        listTalentProfiles(),
        getTalentSummary(),
      ]);

      if (listRes.status === "fulfilled") {
        setRows(getRowsFromResponse(listRes.value));
      } else {
        console.error("Failed to load talent profiles:", listRes.reason);
        setRows([]);
      }

      if (summaryRes.status === "fulfilled") {
        setSummary(getSummaryData(summaryRes.value));
      } else {
        console.error("Failed to load summary:", summaryRes.reason);
        setSummary({});
      }
    } catch (error) {
      console.error("Talent registry load error:", error);
      setRows([]);
      setSummary({});
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
      const registrationNo = String(item?.registration_no || "").toLowerCase();
      const studentName = String(item?.student_name || "").toLowerCase();
      const className = String(item?.class_name || "").toLowerCase();
      const section = String(item?.section || "").toLowerCase();
      const sport = String(item?.sport || "").toLowerCase();
      const eventOrPosition = String(item?.event_or_position || "").toLowerCase();
      const phone = String(item?.phone || "").toLowerCase();
      const email = String(item?.email || "").toLowerCase();
      const guardianName = String(item?.guardian_name || "").toLowerCase();
      const gender = String(item?.gender || "").toLowerCase();
      const level = String(item?.talent_level || "").toLowerCase();
      const status = String(item?.status || "").toLowerCase();

      const matchesSearch =
        !q ||
        registrationNo.includes(q) ||
        studentName.includes(q) ||
        className.includes(q) ||
        section.includes(q) ||
        sport.includes(q) ||
        eventOrPosition.includes(q) ||
        phone.includes(q) ||
        email.includes(q) ||
        guardianName.includes(q);

      const matchesGender =
        !genderFilter || gender === genderFilter.toLowerCase();
      const matchesLevel =
        !levelFilter || level === levelFilter.toLowerCase();
      const matchesStatus =
        !statusFilter || status === statusFilter.toLowerCase();

      return matchesSearch && matchesGender && matchesLevel && matchesStatus;
    });
  }, [rows, search, genderFilter, levelFilter, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, genderFilter, levelFilter, statusFilter]);

  const allGenders = useMemo(
    () => [...new Set(rows.map((item) => item?.gender).filter(Boolean))],
    [rows]
  );

  const allLevels = useMemo(
    () => [...new Set(rows.map((item) => item?.talent_level).filter(Boolean))],
    [rows]
  );

  const allStatuses = useMemo(
    () => [...new Set(rows.map((item) => item?.status).filter(Boolean))],
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
      `Are you sure you want to delete ${selectedIds.length} selected profile${
        selectedIds.length > 1 ? "s" : ""
      }?`
    );
    if (!ok) return;

    try {
      setActionLoading(true);
      await Promise.all(selectedIds.map((id) => deleteTalentProfile(id)));
      setSelectedIds([]);
      await loadData();
    } catch (error) {
      console.error("Bulk delete failed:", error);
      alert("Failed to delete selected talent profiles.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkEdit = () => {
    if (selectedIds.length !== 1) {
      alert("Please select exactly one row to edit.");
      return;
    }
    navigate(`/talent-registry/edit/${selectedIds[0]}`);
  };

  const handleTemplateDownload = async () => {
    try {
      setActionLoading(true);
      const response = await downloadTalentTemplate();
      downloadBlobFile(response, "talent_registry_template.xlsx");
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
      const response = await exportTalentExcel();
      downloadBlobFile(response, "talent_registry_export.xlsx");
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
      const response = await exportTalentPdf();
      downloadBlobFile(response, "talent_registry_report.pdf");
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
      await uploadTalentExcel(formData);
      await loadData();
      alert("Excel uploaded successfully.");
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

  const totalProfiles = summary?.total_profiles ?? rows.length ?? 0;
  const activeProfiles = summary?.active_profiles ?? 0;
  const selectedProfiles = summary?.selected_profiles ?? 0;
  const maleCount = summary?.male_count ?? 0;

  return (
    <div className={styles.page}>
      <div className={styles.heroCard}>
        <div className={styles.heroBadge}>SPORTS TALENT MANAGEMENT</div>
        <h1 className={styles.heroTitle}>Talent Registry Management</h1>
        <p className={styles.heroSubtitle}>
          Create, manage, and monitor player and student talent records with a compact professional layout.
        </p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>TOTAL PROFILES</div>
          <div className={styles.statValue}>{totalProfiles}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>ACTIVE</div>
          <div className={styles.statValue}>{activeProfiles}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>SELECTED</div>
          <div className={styles.statValue}>{selectedProfiles}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>MALE</div>
          <div className={styles.statValue}>{maleCount}</div>
        </div>
      </div>

      <div className={styles.sectionCard}>
        <div className={styles.sectionTop}>
          <div className={styles.sectionTitleWrap}>
            <h2 className={styles.sectionTitle}>Talent Registry List</h2>
            <p className={styles.sectionSubtitle}>
              Search, filter, edit, and maintain talent profile records.
            </p>
          </div>

          <div className={styles.topActions}>
            <Link to="/talent-registry/add" className={styles.primaryBtn}>
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
                <span className={styles.bulkMeta}>
                  Use common actions for selected profiles
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
              Select one or more talent profiles to use common actions above.
            </div>
          )}
        </div>

        <div className={styles.filtersRow}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by reg no, name, class, section, sport, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className={styles.filterSelect}
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
          >
            <option value="">All Genders</option>
            {allGenders.map((item) => (
              <option key={item} value={item}>
                {item === "M" ? "Male" : item === "F" ? "Female" : item}
              </option>
            ))}
          </select>

          <select
            className={styles.filterSelect}
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
          >
            <option value="">All Levels</option>
            {allLevels.map((item) => (
              <option key={item} value={item}>
                {String(item).charAt(0).toUpperCase() + String(item).slice(1)}
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
                {String(item).charAt(0).toUpperCase() + String(item).slice(1)}
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
                  <th>REG NO</th>
                  <th>NAME</th>
                  <th>GENDER</th>
                  <th>DOB</th>
                  <th>CLASS</th>
                  <th>SECTION</th>
                  <th>SPORT</th>
                  <th>POSITION / EVENT</th>
                  <th>LEVEL</th>
                  <th>STATUS</th>
                  <th>PHONE</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="13" className={styles.emptyRow}>
                      Loading talent profiles...
                    </td>
                  </tr>
                ) : paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan="13" className={styles.emptyRow}>
                      No talent profiles found.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((item, index) => {
                    const isSelected = selectedIds.includes(item.id);
                    const status = String(item?.status || "-").toLowerCase();

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
                        <td>{item?.registration_no || "-"}</td>
                        <td>{item?.student_name || "-"}</td>
                        <td>
                          {item?.gender === "M"
                            ? "Male"
                            : item?.gender === "F"
                            ? "Female"
                            : item?.gender || "-"}
                        </td>
                        <td>{formatDate(item?.date_of_birth)}</td>
                        <td>{item?.class_name || "-"}</td>
                        <td>{item?.section || "-"}</td>
                        <td>{item?.sport || "-"}</td>
                        <td>{item?.event_or_position || "-"}</td>
                        <td>{item?.talent_level_display || item?.talent_level || "-"}</td>
                        <td>
                          <span
                            className={`${styles.statusBadge} ${
                              status === "active"
                                ? styles.statusCompleted
                                : status === "selected"
                                ? styles.statusPending
                                : styles.statusCancelled
                            }`}
                          >
                            {status ? status.charAt(0).toUpperCase() + status.slice(1) : "-"}
                          </span>
                        </td>
                        <td>{item?.phone || "-"}</td>
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