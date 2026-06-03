import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./Performance.module.css";
import {
  listPerformanceRecords,
  deletePerformanceRecord,
  getPerformanceSummary,
  downloadPerformanceTemplate,
  uploadPerformanceExcel,
  exportPerformanceExcel,
  exportPerformancePdf,
} from "../../api/performance";

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

export default function PerformanceListPage() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [sportFilter, setSportFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");

  const [selectedIds, setSelectedIds] = useState([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fileInputRef = useRef(null);
  const exportMenuRef = useRef(null);

  const loadData = async () => {
    try {
      setLoading(true);

      const [listRes, summaryRes] = await Promise.allSettled([
        listPerformanceRecords(),
        getPerformanceSummary(),
      ]);

      if (listRes.status === "fulfilled") {
        setRows(getRowsFromResponse(listRes.value));
      } else {
        console.error("Failed to load performance:", listRes.reason);
        setRows([]);
      }

      if (summaryRes.status === "fulfilled") {
        setSummary(getSummaryData(summaryRes.value));
      } else {
        console.error("Failed to load summary:", summaryRes.reason);
        setSummary({});
      }
    } catch (error) {
      console.error("Performance load error:", error);
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
      const studentName = String(item?.student_name || "").toLowerCase();
      const sport = String(item?.sport || "").toLowerCase();
      const eventName = String(item?.event_name || "").toLowerCase();
      const level = String(item?.performance_level || "").toLowerCase();
      const coach = String(item?.coach_name || "").toLowerCase();
      const remarks = String(item?.remarks || "").toLowerCase();

      const matchesSearch =
        !q ||
        studentName.includes(q) ||
        sport.includes(q) ||
        eventName.includes(q) ||
        level.includes(q) ||
        coach.includes(q) ||
        remarks.includes(q);

      const matchesSport = !sportFilter || sport === sportFilter.toLowerCase();
      const matchesLevel = !levelFilter || level === levelFilter.toLowerCase();

      return matchesSearch && matchesSport && matchesLevel;
    });
  }, [rows, search, sportFilter, levelFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sportFilter, levelFilter]);

  const allSports = useMemo(
    () => [...new Set(rows.map((item) => item?.sport).filter(Boolean))],
    [rows]
  );

  const allLevels = useMemo(
    () => [...new Set(rows.map((item) => item?.performance_level).filter(Boolean))],
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

  const handleDeleteSelected = async () => {
    if (!selectedIds.length) {
      alert("Please select at least one row.");
      return;
    }

    const ok = window.confirm(
      `Are you sure you want to delete ${selectedIds.length} selected performance record${
        selectedIds.length > 1 ? "s" : ""
      }?`
    );
    if (!ok) return;

    try {
      setActionLoading(true);
      await Promise.all(selectedIds.map((id) => deletePerformanceRecord(id)));
      setSelectedIds([]);
      await loadData();
    } catch (error) {
      console.error("Bulk delete failed:", error);
      alert(
        error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Failed to delete selected records."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkEdit = () => {
    if (selectedIds.length !== 1) {
      alert("Please select exactly one row to edit.");
      return;
    }
    navigate(`/performance/edit/${selectedIds[0]}`);
  };

  const handleTemplateDownload = async () => {
    try {
      setActionLoading(true);
      const response = await downloadPerformanceTemplate();
      downloadBlobFile(response, "performance_template.xlsx");
      setShowExportMenu(false);
    } catch (error) {
      console.error("Template download failed:", error);
      alert(
        error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Template download failed."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleExcelExport = async () => {
    try {
      setActionLoading(true);
      const response = await exportPerformanceExcel();
      downloadBlobFile(response, "performance_export.xlsx");
      setShowExportMenu(false);
    } catch (error) {
      console.error("Excel export failed:", error);
      alert(
        error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Excel export failed."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handlePdfExport = async () => {
    try {
      setActionLoading(true);
      const response = await exportPerformancePdf();
      downloadBlobFile(response, "performance_report.pdf");
      setShowExportMenu(false);
    } catch (error) {
      console.error("PDF export failed:", error);
      alert(
        error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "PDF export failed."
      );
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
      formData.append("excel_file", file);
      await uploadPerformanceExcel(formData);
      await loadData();
      alert("Excel uploaded successfully.");
    } catch (error) {
      console.error("Upload failed:", error);
      alert(
        error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Excel upload failed."
      );
    } finally {
      event.target.value = "";
      setActionLoading(false);
    }
  };

  const totalRecords = summary?.total_records ?? rows.length ?? 0;
  const excellentCount = summary?.excellent ?? 0;
  const goodCount = summary?.good ?? 0;
  const avgScore = summary?.avg_score ?? 0;

  return (
    <div className={styles.page}>
      <div className={styles.heroCard}>
        <div>
          <div className={styles.heroBadge}>SPORTS TALENT MANAGEMENT</div>
          <h1 className={styles.heroTitle}>Performance Management</h1>
          <p className={styles.heroSubtitle}>
            Create, manage, filter, import, and monitor player performance records.
          </p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>TOTAL RECORDS</div>
          <div className={styles.statValue}>{totalRecords}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>EXCELLENT</div>
          <div className={styles.statValue}>{excellentCount}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>GOOD</div>
          <div className={styles.statValue}>{goodCount}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>AVERAGE SCORE</div>
          <div className={styles.statValue}>{avgScore}</div>
        </div>
      </div>

      <div className={styles.sectionCard}>
        <div className={styles.sectionTop}>
          <div className={styles.sectionTitleWrap}>
            <h2 className={styles.sectionTitle}>Performance List</h2>
            <p className={styles.sectionSubtitle}>
              Search, filter, edit, and maintain performance records.
            </p>
          </div>

          <div className={styles.topActions}>
            <Link to="/performance/add" className={styles.primaryBtn}>
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
                  <button type="button" className={styles.dropdownItem} onClick={handleUploadClick}>
                    Upload Excel
                  </button>
                  <button type="button" className={styles.dropdownItem} onClick={handleTemplateDownload}>
                    Download Template
                  </button>
                  <button type="button" className={styles.dropdownItem} onClick={handleExcelExport}>
                    Download Excel
                  </button>
                  <button type="button" className={styles.dropdownItem} onClick={handlePdfExport}>
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
              Select one or more performance records to use common actions above.
            </div>
          )}
        </div>

        <div className={styles.filtersRow}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by student, sport, event, coach..."
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
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
          >
            <option value="">All Levels</option>
            {allLevels.map((item) => (
              <option key={item} value={item}>
                {String(item).replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
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
                  <th>DATE</th>
                  <th>STUDENT NAME</th>
                  <th>SPORT</th>
                  <th>EVENT</th>
                  <th>SCORE</th>
                  <th>LEVEL</th>
                  <th>COACH</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" className={styles.emptyRow}>
                      Loading performance records...
                    </td>
                  </tr>
                ) : paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan="9" className={styles.emptyRow}>
                      No performance records found.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((item, index) => {
                    const level = String(item?.performance_level || "-").toLowerCase();
                    const isSelected = selectedIds.includes(item.id);

                    return (
                      <tr
                        key={item.id}
                        className={`${styles.clickableRow} ${isSelected ? styles.selectedRow : ""}`}
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

                        <td className={styles.serialCell}>{startIndex + index + 1}</td>
                        <td>{formatDate(item?.performance_date)}</td>
                        <td>{item?.student_name || "-"}</td>
                        <td>{item?.sport || "-"}</td>
                        <td>{item?.event_name || "-"}</td>
                        <td>{item?.performance_score ?? 0}</td>
                        <td>
                          <span className={styles.typeBadge}>
                            {level ? level.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "-"}
                          </span>
                        </td>
                        <td>{item?.coach_name || "-"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.paginationWrap}>
          <button
            type="button"
            className={styles.paginationBtn}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={safeCurrentPage === 1}
          >
            Prev
          </button>

          <div className={styles.paginationInfo}>
            Page {safeCurrentPage} of {totalPages}
          </div>

          <button
            type="button"
            className={styles.paginationBtn}
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={safeCurrentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}