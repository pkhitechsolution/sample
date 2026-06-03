import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./Accounts.module.css";
import {
  listAccounts,
  deleteAccount,
  getAccountsSummary,
  downloadAccountsTemplate,
  uploadAccountsExcel,
  exportAccountsExcel,
  exportAccountsPdf,
} from "../../api/accounts";

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

function formatCurrency(value) {
  const amount = Number(value || 0);
  return `₹ ${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
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

export default function AccountsListPage() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [selectedIds, setSelectedIds] = useState([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fileInputRef = useRef(null);
  const exportMenuRef = useRef(null);

  const loadData = async () => {
    try {
      setLoading(true);

      const [listRes, summaryRes] = await Promise.allSettled([
        listAccounts(),
        getAccountsSummary(),
      ]);

      if (listRes.status === "fulfilled") {
        setRows(getRowsFromResponse(listRes.value));
      } else {
        console.error("Failed to load accounts:", listRes.reason);
        setRows([]);
      }

      if (summaryRes.status === "fulfilled") {
        setSummary(getSummaryData(summaryRes.value));
      } else {
        console.error("Failed to load summary:", summaryRes.reason);
        setSummary({});
      }
    } catch (error) {
      console.error("Accounts load error:", error);
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
      const description = String(item?.description || "").toLowerCase();
      const category = String(item?.category || "").toLowerCase();
      const reference = String(item?.reference_no || "").toLowerCase();
      const paymentMethod = String(item?.payment_method || "").toLowerCase();
      const type = String(item?.transaction_type || "").toLowerCase();
      const status = String(item?.status || "").toLowerCase();

      const matchesSearch =
        !q ||
        description.includes(q) ||
        category.includes(q) ||
        reference.includes(q) ||
        paymentMethod.includes(q) ||
        type.includes(q) ||
        status.includes(q);

      const matchesType = !typeFilter || type === typeFilter.toLowerCase();
      const matchesStatus = !statusFilter || status === statusFilter.toLowerCase();
      const matchesCategory =
        !categoryFilter || category === categoryFilter.toLowerCase();

      return matchesSearch && matchesType && matchesStatus && matchesCategory;
    });
  }, [rows, search, typeFilter, statusFilter, categoryFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter, statusFilter, categoryFilter]);

  const allTypes = useMemo(
    () => [...new Set(rows.map((item) => item?.transaction_type).filter(Boolean))],
    [rows]
  );

  const allStatuses = useMemo(
    () => [...new Set(rows.map((item) => item?.status).filter(Boolean))],
    [rows]
  );

  const allCategories = useMemo(
    () => [...new Set(rows.map((item) => item?.category).filter(Boolean))],
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

  const handleDeleteOne = async (id) => {
    const ok = window.confirm("Are you sure you want to delete this account entry?");
    if (!ok) return;

    try {
      setActionLoading(true);
      await deleteAccount(id);
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      await loadData();
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete entry.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedIds.length) {
      alert("Please select at least one row.");
      return;
    }

    const ok = window.confirm(
      `Are you sure you want to delete ${selectedIds.length} selected entr${
        selectedIds.length > 1 ? "ies" : "y"
      }?`
    );
    if (!ok) return;

    try {
      setActionLoading(true);
      await Promise.all(selectedIds.map((id) => deleteAccount(id)));
      setSelectedIds([]);
      await loadData();
    } catch (error) {
      console.error("Bulk delete failed:", error);
      alert("Failed to delete selected entries.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkEdit = () => {
    if (selectedIds.length !== 1) {
      alert("Please select exactly one row to edit.");
      return;
    }
    navigate(`/accounts/edit/${selectedIds[0]}`);
  };

  const handleTemplateDownload = async () => {
    try {
      setActionLoading(true);
      const response = await downloadAccountsTemplate();
      downloadBlobFile(response, "accounts_template.xlsx");
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
      const response = await exportAccountsExcel();
      downloadBlobFile(response, "accounts_export.xlsx");
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
      const response = await exportAccountsPdf();
      downloadBlobFile(response, "accounts_report.pdf");
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
      await uploadAccountsExcel(formData);
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

  const totalEntries = summary?.total_entries ?? rows.length ?? 0;
  const totalIncome = summary?.total_income ?? 0;
  const totalExpense = summary?.total_expense ?? 0;
  const pendingCount = summary?.pending_count ?? 0;

  return (
    <div className={styles.page}>
      <div className={styles.heroCard}>
        <div className={styles.heroBadge}>SPORTS TALENT MANAGEMENT</div>
        <h1 className={styles.heroTitle}>Accounts Management</h1>
        <p className={styles.heroSubtitle}>
          Create, manage, and monitor financial transactions with a compact professional layout.
        </p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>TOTAL ENTRIES</div>
          <div className={styles.statValue}>{totalEntries}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>TOTAL INCOME</div>
          <div className={styles.statValue}>{formatCurrency(totalIncome)}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>TOTAL EXPENSE</div>
          <div className={styles.statValue}>{formatCurrency(totalExpense)}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>PENDING</div>
          <div className={styles.statValue}>{pendingCount}</div>
        </div>
      </div>

      <div className={styles.sectionCard}>
        <div className={styles.sectionTop}>
          <div className={styles.sectionTitleWrap}>
            <h2 className={styles.sectionTitle}>Accounts List</h2>
            <p className={styles.sectionSubtitle}>
              Search, filter, edit, and maintain transaction records.
            </p>
          </div>

          <div className={styles.topActions}>
            <Link to="/accounts/add" className={styles.primaryBtn}>
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
              Select one or more transactions to use common actions above.
            </div>
          )}
        </div>

        <div className={styles.filtersRow}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by category, description, reference..."
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
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {allCategories.map((item) => (
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
                  <th>DATE</th>
                  <th>CATEGORY</th>
                  <th>TYPE</th>
                  <th>DESCRIPTION</th>
                  <th>AMOUNT</th>
                  <th>PAYMENT METHOD</th>
                  <th>STATUS</th>
                  <th>REFERENCE</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="10" className={styles.emptyRow}>
                      Loading accounts...
                    </td>
                  </tr>
                ) : paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan="10" className={styles.emptyRow}>
                      No account records found.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((item, index) => {
                    const type = String(item?.transaction_type || "-").toLowerCase();
                    const status = String(item?.status || "-").toLowerCase();
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

                        <td className={styles.serialCell}>
                          {startIndex + index + 1}
                        </td>
                        <td>{formatDate(item?.date)}</td>
                        <td>{item?.category || "-"}</td>

                        <td>
                          <span className={type === "income" ? styles.typeIncome : styles.typeExpense}>
                            {type === "income"
                              ? "Income"
                              : type === "expense"
                              ? "Expense"
                              : "-"}
                          </span>
                        </td>

                        <td>{item?.description || "-"}</td>
                        <td className={styles.amountCell}>{formatCurrency(item?.amount || 0)}</td>
                        <td>{item?.payment_method || "-"}</td>

                        <td>
                          <span
                            className={`${styles.statusBadge} ${
                              status === "completed"
                                ? styles.statusCompleted
                                : status === "pending"
                                ? styles.statusPending
                                : styles.statusCancelled
                            }`}
                          >
                            {status ? status.charAt(0).toUpperCase() + status.slice(1) : "-"}
                          </span>
                        </td>

                        <td>{item?.reference_no || "-"}</td>
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