import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./OfficialsListPage.module.css";
import {
  getOfficials,
  getOfficialsSummary,
  deleteOfficial,
  uploadOfficialsExcel,
  downloadOfficialsTemplate,
  exportOfficialsExcel,
  exportOfficialsPdf,
} from "../../api/officials";

const PAGE_SIZE = 10;

function getRowsFromResponse(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.results)) return response.data.results;
  return [];
}

function normalizeValue(value) {
  return String(value || "").trim().toLowerCase();
}

function formatLabel(value) {
  return String(value || "-")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getStatusClass(status) {
  const value = normalizeValue(status);
  if (value === "active") return styles.statusActive;
  if (value === "inactive") return styles.statusInactive;
  return styles.statusDefault;
}

function getAvailabilityClass(availability) {
  const value = normalizeValue(availability);
  if (value === "available") return styles.statusAvailable;
  if (value === "busy") return styles.statusBusy;
  if (value === "unavailable") return styles.statusUnavailable;
  return styles.statusDefault;
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

function buildSummaryFromRows(rows) {
  const total = rows.length;

  const active = rows.filter(
    (item) => normalizeValue(item?.status) === "active"
  ).length;

  const available = rows.filter(
    (item) => normalizeValue(item?.availability) === "available"
  ).length;

  const busy = rows.filter(
    (item) => normalizeValue(item?.availability) === "busy"
  ).length;

  const referees = rows.filter(
    (item) =>
      normalizeValue(item?.role) === "referee" ||
      normalizeValue(item?.role_label) === "referee"
  ).length;

  const umpires = rows.filter(
    (item) =>
      normalizeValue(item?.role) === "umpire" ||
      normalizeValue(item?.role_label) === "umpire"
  ).length;

  return {
    total_officials: total,
    active_officials: active,
    available_officials: available,
    busy_officials: busy,
    referees,
    umpires,
  };
}

export default function OfficialsListPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const exportMenuRef = useRef(null);

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({
    total_officials: 0,
    active_officials: 0,
    available_officials: 0,
    busy_officials: 0,
    referees: 0,
    umpires: 0,
  });

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("");

  const [selectedIds, setSelectedIds] = useState([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const officialsResponse = await getOfficials();
      const officialsRows = getRowsFromResponse(officialsResponse);
      setRows(officialsRows);

      let summaryData = null;

      try {
        summaryData = await getOfficialsSummary();
      } catch (summaryError) {
        console.warn("Officials summary endpoint failed:", summaryError);
      }

      if (summaryData) {
        setSummary({
          total_officials: summaryData?.total_officials || 0,
          active_officials: summaryData?.active_officials || 0,
          available_officials: summaryData?.available_officials || 0,
          busy_officials: summaryData?.busy_officials || 0,
          referees: summaryData?.referees || 0,
          umpires: summaryData?.umpires || 0,
        });
      } else {
        setSummary(buildSummaryFromRows(officialsRows));
      }
    } catch (err) {
      console.error("Officials load error:", err);
      setRows([]);
      setSummary({
        total_officials: 0,
        active_officials: 0,
        available_officials: 0,
        busy_officials: 0,
        referees: 0,
        umpires: 0,
      });
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Failed to load officials."
      );
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
      const fullName = String(item?.full_name || "").toLowerCase();
      const officialCode = String(item?.official_code || "").toLowerCase();
      const role = String(item?.role || item?.role_label || "").toLowerCase();
      const sport = String(item?.sport || "").toLowerCase();
      const phone = String(item?.phone || "").toLowerCase();
      const email = String(item?.email || "").toLowerCase();
      const qualification = String(item?.qualification || "").toLowerCase();
      const status = String(item?.status || "").toLowerCase();
      const availability = String(item?.availability || "").toLowerCase();

      const matchesSearch =
        !q ||
        fullName.includes(q) ||
        officialCode.includes(q) ||
        role.includes(q) ||
        sport.includes(q) ||
        phone.includes(q) ||
        email.includes(q) ||
        qualification.includes(q);

      const matchesRole = !roleFilter || role === roleFilter.toLowerCase();
      const matchesStatus =
        !statusFilter || status === statusFilter.toLowerCase();
      const matchesAvailability =
        !availabilityFilter || availability === availabilityFilter.toLowerCase();

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus &&
        matchesAvailability
      );
    });
  }, [rows, search, roleFilter, statusFilter, availabilityFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter, statusFilter, availabilityFilter]);

  const allRoles = useMemo(
    () => [...new Set(rows.map((item) => item?.role).filter(Boolean))],
    [rows]
  );

  const allStatuses = useMemo(
    () => [...new Set(rows.map((item) => item?.status).filter(Boolean))],
    [rows]
  );

  const allAvailability = useMemo(
    () => [...new Set(rows.map((item) => item?.availability).filter(Boolean))],
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
      alert("Please select exactly one official to edit.");
      return;
    }
    navigate(`/officials/edit/${selectedIds[0]}`);
  };

  const handleDeleteSelected = async () => {
    if (!selectedIds.length) {
      alert("Please select at least one official.");
      return;
    }

    const ok = window.confirm(
      `Are you sure you want to delete ${selectedIds.length} selected official${
        selectedIds.length > 1 ? "s" : ""
      }?`
    );
    if (!ok) return;

    try {
      setActionLoading(true);
      await Promise.all(selectedIds.map((id) => deleteOfficial(id)));
      setSelectedIds([]);
      await loadData();
    } catch (err) {
      console.error("Bulk delete failed:", err);
      alert(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Failed to delete selected officials."
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

      const data = await uploadOfficialsExcel(formData);

      const skippedRows = Array.isArray(data?.skipped_rows)
        ? data.skipped_rows
        : [];

      const messageLines = [
        data?.detail || "Officials Excel uploaded successfully.",
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
        (err?.response?.status === 403
          ? "Authentication credentials were not provided. Please login again."
          : "Officials Excel upload failed.");

      alert(message);
    } finally {
      event.target.value = "";
      setActionLoading(false);
    }
  };

  const handleTemplateDownload = async () => {
    try {
      setActionLoading(true);
      const response = await downloadOfficialsTemplate();
      downloadBlobFile(response, "officials_template.xlsx");
      setShowExportMenu(false);
    } catch (err) {
      console.error("Template download failed:", err);
      alert(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Template download failed."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleExcelExport = async () => {
    try {
      setActionLoading(true);
      const response = await exportOfficialsExcel();
      downloadBlobFile(response, "officials_export.xlsx");
      setShowExportMenu(false);
    } catch (err) {
      console.error("Excel export failed:", err);
      alert(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Excel export failed."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handlePdfExport = async () => {
    try {
      setActionLoading(true);
      const response = await exportOfficialsPdf();
      downloadBlobFile(response, "officials_report.pdf");
      setShowExportMenu(false);
    } catch (err) {
      console.error("PDF export failed:", err);
      alert(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "PDF export failed."
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.heroCard}>
        <div className={styles.heroBadge}>SPORTS TALENT MANAGEMENT</div>
        <h1 className={styles.heroTitle}>Officials Management</h1>
        <p className={styles.heroSubtitle}>
          Create, manage, and monitor referees, umpires, and other match
          officials with the same compact professional layout used in the
          Matches module.
        </p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>TOTAL OFFICIALS</div>
          <div className={styles.statValue}>{summary.total_officials}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>ACTIVE</div>
          <div className={styles.statValue}>{summary.active_officials}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>AVAILABLE</div>
          <div className={styles.statValue}>{summary.available_officials}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>BUSY</div>
          <div className={styles.statValue}>{summary.busy_officials}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>REFEREES</div>
          <div className={styles.statValue}>{summary.referees}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>UMPIRES</div>
          <div className={styles.statValue}>{summary.umpires}</div>
        </div>
      </div>

      <div className={styles.sectionCard}>
        <div className={styles.sectionTop}>
          <div className={styles.sectionTitleWrap}>
            <h2 className={styles.sectionTitle}>Officials List</h2>
            <p className={styles.sectionSubtitle}>
              Search, filter, edit, and maintain official records.
            </p>
          </div>

          <div className={styles.topActions}>
            <Link to="/officials/add" className={styles.primaryBtn}>
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
              Select one or more officials to use common actions above.
            </div>
          )}
        </div>

        <div className={styles.filtersRow}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by name, code, sport, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className={styles.filterSelect}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            {allRoles.map((item) => (
              <option key={item} value={item}>
                {formatLabel(item)}
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
                {formatLabel(item)}
              </option>
            ))}
          </select>

          <select
            className={styles.filterSelect}
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
          >
            <option value="">All Availability</option>
            {allAvailability.map((item) => (
              <option key={item} value={item}>
                {formatLabel(item)}
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
                  <th>OFFICIAL</th>
                  <th>ROLE</th>
                  <th>SPORT</th>
                  <th>CONTACT</th>
                  <th>QUALIFICATION</th>
                  <th>EXPERIENCE</th>
                  <th>AVAILABILITY</th>
                  <th>STATUS</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="10" className={styles.emptyRow}>
                      Loading officials...
                    </td>
                  </tr>
                ) : paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan="10" className={styles.emptyRow}>
                      No official records found.
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
                            {item?.full_name || "-"}
                          </div>
                          <div className={styles.subText}>
                            {item?.official_code || item?.email || "-"}
                          </div>
                        </td>

                        <td>{formatLabel(item?.role_label || item?.role || "-")}</td>
                        <td>{item?.sport || "-"}</td>

                        <td>
                          <div className={styles.contactText}>
                            {item?.phone || "-"}
                          </div>
                          <div className={styles.subText}>
                            {item?.email || "-"}
                          </div>
                        </td>

                        <td>{item?.qualification || "-"}</td>
                        <td>{item?.experience_years ?? 0} yrs</td>

                        <td>
                          <span
                            className={`${styles.statusBadge} ${getAvailabilityClass(
                              item?.availability
                            )}`}
                          >
                            {formatLabel(
                              item?.availability_label || item?.availability || "-"
                            )}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`${styles.statusBadge} ${getStatusClass(
                              item?.status
                            )}`}
                          >
                            {formatLabel(item?.status_label || item?.status || "-")}
                          </span>
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
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}