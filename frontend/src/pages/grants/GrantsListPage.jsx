import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./Grants.module.css";
import {
  listGrants,
  deleteGrant,
  getGrantsSummary,
  downloadGrantTemplate,
  uploadGrantsExcel,
  exportGrantsExcel,
  exportGrantsPdf,
} from "../../api/grants";

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

function formatCurrency(value) {
  const num = Number(value || 0);
  return `₹ ${num.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
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

export default function GrantsListPage() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [agencyFilter, setAgencyFilter] = useState("");

  const [selectedIds, setSelectedIds] = useState([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fileInputRef = useRef(null);
  const exportMenuRef = useRef(null);

  const loadData = async () => {
    try {
      setLoading(true);

      const [listRes, summaryRes] = await Promise.allSettled([
        listGrants(),
        getGrantsSummary(),
      ]);

      if (listRes.status === "fulfilled") {
        setRows(getRowsFromResponse(listRes.value));
      } else {
        console.error("Failed to load grants:", listRes.reason);
        setRows([]);
      }

      if (summaryRes.status === "fulfilled") {
        setSummary(getSummaryData(summaryRes.value));
      } else {
        console.error("Failed to load grants summary:", summaryRes.reason);
        setSummary({});
      }
    } catch (error) {
      console.error("Grants load error:", error);
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
      const grantName = String(item?.grant_name || "").toLowerCase();
      const grantType = String(item?.grant_type || "").toLowerCase();
      const fundingAgency = String(item?.funding_agency || "").toLowerCase();
      const purpose = String(item?.purpose || "").toLowerCase();
      const status = String(item?.status || "").toLowerCase();

      const matchesSearch =
        !q ||
        grantName.includes(q) ||
        grantType.includes(q) ||
        fundingAgency.includes(q) ||
        purpose.includes(q) ||
        status.includes(q);

      const matchesStatus =
        !statusFilter || status === statusFilter.toLowerCase();
      const matchesType =
        !typeFilter || grantType === typeFilter.toLowerCase();
      const matchesAgency =
        !agencyFilter || fundingAgency === agencyFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesType && matchesAgency;
    });
  }, [rows, search, statusFilter, typeFilter, agencyFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, typeFilter, agencyFilter]);

  const allStatuses = useMemo(
    () => [...new Set(rows.map((item) => item?.status).filter(Boolean))],
    [rows]
  );

  const allTypes = useMemo(
    () => [...new Set(rows.map((item) => item?.grant_type).filter(Boolean))],
    [rows]
  );

  const allAgencies = useMemo(
    () => [...new Set(rows.map((item) => item?.funding_agency).filter(Boolean))],
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
      `Are you sure you want to delete ${selectedIds.length} selected grant${
        selectedIds.length > 1 ? "s" : ""
      }?`
    );
    if (!ok) return;

    try {
      setActionLoading(true);
      await Promise.all(selectedIds.map((id) => deleteGrant(id)));
      setSelectedIds([]);
      await loadData();
    } catch (error) {
      console.error("Bulk delete failed:", error);
      alert(
        error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Failed to delete selected grants."
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
    navigate(`/grants/edit/${selectedIds[0]}`);
  };

  const handleTemplateDownload = async () => {
    try {
      setActionLoading(true);
      const response = await downloadGrantTemplate();
      downloadBlobFile(response, "grants_template.xlsx");
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
      const response = await exportGrantsExcel();
      downloadBlobFile(response, "grants_export.xlsx");
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
      const response = await exportGrantsPdf();
      downloadBlobFile(response, "grants_report.pdf");
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
      await uploadGrantsExcel(formData);
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

  const totalGrants = summary?.total_grants ?? rows.length ?? 0;
  const approvedCount = summary?.approved ?? 0;
  const pendingCount = summary?.pending ?? 0;
  const rejectedCount = summary?.rejected ?? 0;
  const totalRequested = summary?.total_requested ?? 0;
  const totalApproved = summary?.total_approved ?? 0;

  return (
    <div className={styles.page}>
      <div className={styles.heroCard}>
        <div className={styles.heroBadge}>SPORTS TALENT MANAGEMENT</div>
        <h1 className={styles.heroTitle}>Grants Management</h1>
        <p className={styles.heroSubtitle}>
          Create, manage, filter, import, and monitor grants with the same
          professional layout as the reports module.
        </p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>TOTAL GRANTS</div>
          <div className={styles.statValue}>{totalGrants}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>APPROVED</div>
          <div className={styles.statValue}>{approvedCount}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>PENDING</div>
          <div className={styles.statValue}>{pendingCount}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>REJECTED</div>
          <div className={styles.statValue}>{rejectedCount}</div>
        </div>
      </div>

      <div className={styles.summaryStrip}>
        <div className={styles.summaryMiniCard}>
          <span className={styles.summaryMiniLabel}>TOTAL REQUESTED</span>
          <strong className={styles.summaryMiniValue}>
            {formatCurrency(totalRequested)}
          </strong>
        </div>
        <div className={styles.summaryMiniCard}>
          <span className={styles.summaryMiniLabel}>TOTAL APPROVED</span>
          <strong className={styles.summaryMiniValue}>
            {formatCurrency(totalApproved)}
          </strong>
        </div>
      </div>

      <div className={styles.sectionCard}>
        <div className={styles.sectionTop}>
          <div className={styles.sectionTitleWrap}>
            <h2 className={styles.sectionTitle}>Grants List</h2>
            <p className={styles.sectionSubtitle}>
              Search, filter, edit, and maintain grant records.
            </p>
          </div>

          <div className={styles.topActions}>
            <Link to="/grants/add" className={styles.primaryBtn}>
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
              Select one or more grants to use common actions above.
            </div>
          )}
        </div>

        <div className={styles.filtersRow}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by grant name, type, agency, purpose..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className={styles.filterSelect}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            {allTypes.map((item) => (
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

          <select
            className={styles.filterSelect}
            value={agencyFilter}
            onChange={(e) => setAgencyFilter(e.target.value)}
          >
            <option value="">All Agencies</option>
            {allAgencies.map((item) => (
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
                  <th>APPLIED DATE</th>
                  <th>GRANT NAME</th>
                  <th>TYPE</th>
                  <th>FUNDING AGENCY</th>
                  <th>REQUESTED</th>
                  <th>APPROVED</th>
                  <th>STATUS</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" className={styles.emptyRow}>
                      Loading grants...
                    </td>
                  </tr>
                ) : paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan="9" className={styles.emptyRow}>
                      No grant records found.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((item, index) => {
                    const status = String(item?.status || "-").toLowerCase();
                    const type = String(item?.grant_type || "-").toLowerCase();
                    const isSelected = selectedIds.includes(item.id);

                    return (
                      <tr
                        key={item.id}
                        className={`${styles.clickableRow} ${
                          isSelected ? styles.selectedRow : ""
                        }`}
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
                        <td>{formatDate(item?.applied_date)}</td>
                        <td>{item?.grant_name || "-"}</td>

                        <td>
                          <span className={styles.typeBadge}>
                            {type ? type.charAt(0).toUpperCase() + type.slice(1) : "-"}
                          </span>
                        </td>

                        <td>{item?.funding_agency || "-"}</td>
                        <td>{formatCurrency(item?.amount_requested)}</td>
                        <td>{formatCurrency(item?.amount_approved)}</td>

                        <td>
                          <span
                            className={`${styles.statusBadge} ${
                              status === "approved"
                                ? styles.statusApproved
                                : status === "pending"
                                ? styles.statusPending
                                : status === "rejected"
                                ? styles.statusRejected
                                : styles.statusDraft
                            }`}
                          >
                            {status ? status.charAt(0).toUpperCase() + status.slice(1) : "-"}
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