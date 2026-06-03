import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./Inventory.module.css";
import {
  listInventoryItems,
  deleteInventoryItem,
  getInventorySummary,
  getInventoryCategories,
  downloadInventoryTemplate,
  uploadInventoryExcel,
  exportInventoryExcel,
  exportInventoryPdf,
} from "../../api/inventory";

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

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return "-";
  const number = Number(value);
  if (Number.isNaN(number)) return value;
  return number.toFixed(2);
}

function getCategoryName(item) {
  if (!item) return "";
  if (typeof item.category_name === "string" && item.category_name.trim()) {
    return item.category_name.trim();
  }
  if (typeof item.category === "string" && item.category.trim()) {
    return item.category.trim();
  }
  if (item.category && typeof item.category === "object") {
    return item.category.name || item.category.title || "";
  }
  return "";
}

function normalizeStatus(value, quantity) {
  const raw = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_")
    .replace(/\s+/g, "_");

  if (raw === "available") return "available";
  if (raw === "low_stock" || raw === "lowstock") return "low_stock";
  if (raw === "out_of_stock" || raw === "outofstock") return "out_of_stock";

  const qty = Number(quantity || 0);
  if (qty <= 0) return "out_of_stock";
  if (qty <= 5) return "low_stock";
  return "available";
}

function prettyStatus(value, quantity) {
  const normalized = normalizeStatus(value, quantity);
  return normalized
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function InventoryListPage() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [selectedIds, setSelectedIds] = useState([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fileInputRef = useRef(null);
  const exportMenuRef = useRef(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorText("");

      const [listRes, summaryRes, categoriesRes] = await Promise.allSettled([
        listInventoryItems(),
        getInventorySummary(),
        getInventoryCategories(),
      ]);

      const statuses = [
        listRes.status === "rejected" ? listRes.reason?.response?.status : null,
        summaryRes.status === "rejected" ? summaryRes.reason?.response?.status : null,
        categoriesRes.status === "rejected" ? categoriesRes.reason?.response?.status : null,
      ];

      if (statuses.includes(401) || statuses.includes(403)) {
        setRows([]);
        setSummary({});
        setCategories([]);
        setErrorText("Authentication required. Please login again.");
        return;
      }

      if (listRes.status === "fulfilled") {
        setRows(getRowsFromResponse(listRes.value));
      } else {
        setRows([]);
        setErrorText(
          listRes.reason?.response?.data?.detail ||
            listRes.reason?.response?.data?.message ||
            "Failed to load inventory records."
        );
      }

      if (summaryRes.status === "fulfilled") {
        setSummary(getSummaryData(summaryRes.value));
      } else {
        setSummary({});
      }

      if (categoriesRes.status === "fulfilled") {
        const data = categoriesRes.value?.data;
        if (Array.isArray(data)) {
          setCategories(data);
        } else if (Array.isArray(data?.results)) {
          setCategories(data.results);
        } else {
          setCategories([]);
        }
      } else {
        setCategories([]);
      }
    } catch (error) {
      setRows([]);
      setSummary({});
      setCategories([]);
      setErrorText(
        error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Something went wrong while loading inventory."
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
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();

    return rows.filter((item) => {
      const itemName = String(item?.item_name || item?.name || "").toLowerCase();
      const category = String(getCategoryName(item) || "").toLowerCase();
      const sku = String(item?.sku || "").toLowerCase();
      const brand = String(item?.brand || "").toLowerCase();
      const supplier = String(item?.supplier || "").toLowerCase();
      const location = String(item?.location || "").toLowerCase();
      const status = normalizeStatus(item?.status, item?.quantity);

      const matchesSearch =
        !q ||
        itemName.includes(q) ||
        category.includes(q) ||
        sku.includes(q) ||
        brand.includes(q) ||
        supplier.includes(q) ||
        location.includes(q);

      const matchesCategory =
        !categoryFilter || category === String(categoryFilter).toLowerCase();

      const matchesStatus =
        !statusFilter || status === String(statusFilter).toLowerCase();

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [rows, search, categoryFilter, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, statusFilter]);

  const uniqueCategories = useMemo(() => {
    const fromRows = rows.map((item) => getCategoryName(item)).filter(Boolean);
    const fromApi = categories
      .map((item) =>
        typeof item === "string" ? item : item?.name || item?.category || item?.title
      )
      .filter(Boolean);

    return [...new Set([...fromApi, ...fromRows])];
  }, [rows, categories]);

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
    const isInteractive = target.closest("button, a, input, select, textarea, label");
    if (isInteractive) return;
    toggleSelectOne(id);
  };

  const handleDeleteSelected = async () => {
    if (!selectedIds.length) {
      alert("Please select at least one row.");
      return;
    }

    const ok = window.confirm(
      `Are you sure you want to delete ${selectedIds.length} selected inventory item${
        selectedIds.length > 1 ? "s" : ""
      }?`
    );
    if (!ok) return;

    try {
      setActionLoading(true);
      await Promise.all(selectedIds.map((id) => deleteInventoryItem(id)));
      setSelectedIds([]);
      await loadData();
    } catch (error) {
      alert(
        error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Failed to delete selected inventory items."
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
    navigate(`/inventory/edit/${selectedIds[0]}`);
  };

  const handleTemplateDownload = async () => {
    try {
      setActionLoading(true);
      const response = await downloadInventoryTemplate();
      downloadBlobFile(response, "inventory_template.xlsx");
      setShowExportMenu(false);
    } catch (error) {
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
      const response = await exportInventoryExcel();
      downloadBlobFile(response, "inventory_export.xlsx");
      setShowExportMenu(false);
    } catch (error) {
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
      const response = await exportInventoryPdf();
      downloadBlobFile(response, "inventory_report.pdf");
      setShowExportMenu(false);
    } catch (error) {
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
      await uploadInventoryExcel(file);
      await loadData();
      alert("Excel uploaded successfully.");
    } catch (error) {
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

  const totalItems = summary?.total_items ?? rows.length ?? 0;
  const totalQuantity =
    summary?.total_quantity ??
    rows.reduce((sum, item) => sum + Number(item?.quantity || 0), 0);

  const availableCount =
    summary?.available_count ??
    rows.filter((item) => normalizeStatus(item?.status, item?.quantity) === "available").length;

  const outOfStockCount =
    summary?.out_of_stock_count ??
    rows.filter((item) => normalizeStatus(item?.status, item?.quantity) === "out_of_stock").length;

  return (
    <div className={styles.page}>
      <div className={styles.heroCard}>
        <div>
          <div className={styles.heroBadge}>SPORTS TALENT MANAGEMENT</div>
          <h1 className={styles.heroTitle}>Inventory Management</h1>
          <p className={styles.heroSubtitle}>
            Create, manage, filter, import, and monitor inventory and stock records.
          </p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>TOTAL ITEMS</div>
          <div className={styles.statValue}>{totalItems}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>TOTAL QUANTITY</div>
          <div className={styles.statValue}>{totalQuantity}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>AVAILABLE</div>
          <div className={styles.statValue}>{availableCount}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>OUT OF STOCK</div>
          <div className={styles.statValue}>{outOfStockCount}</div>
        </div>
      </div>

      <div className={styles.sectionCard}>
        <div className={styles.sectionTop}>
          <div className={styles.sectionTitleWrap}>
            <h2 className={styles.sectionTitle}>Inventory List</h2>
            <p className={styles.sectionSubtitle}>
              Search, filter, edit, and maintain inventory records.
            </p>
          </div>

          <div className={styles.topActions}>
            <Link to="/inventory/add" className={styles.primaryBtn}>
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
                {selectedIds.length === 1 ? (
                  <button
                    type="button"
                    className={styles.bulkEditBtn}
                    onClick={handleBulkEdit}
                    disabled={actionLoading}
                  >
                    Edit
                  </button>
                ) : null}

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
              Select one or more inventory records to use common actions above.
            </div>
          )}
        </div>

        <div className={styles.filtersRow}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by item, category, brand, supplier, SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className={styles.filterSelect}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {uniqueCategories.map((item) => (
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
            <option value="available">Available</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out Of Stock</option>
          </select>
        </div>

        {errorText ? <div className={styles.errorText}>{errorText}</div> : null}

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
                  <th>ITEM NAME</th>
                  <th>CATEGORY</th>
                  <th>SKU</th>
                  <th>BRAND</th>
                  <th>QUANTITY</th>
                  <th>UNIT PRICE</th>
                  <th>STATUS</th>
                  <th>SUPPLIER</th>
                  <th>LOCATION</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="11" className={styles.emptyRow}>
                      Loading inventory records...
                    </td>
                  </tr>
                ) : paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan="11" className={styles.emptyRow}>
                      No inventory records found.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((item, index) => {
                    const normalizedStatus = normalizeStatus(item?.status, item?.quantity);
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

                        <td className={styles.serialCell}>{startIndex + index + 1}</td>
                        <td>{item?.item_name || item?.name || "-"}</td>
                        <td>{getCategoryName(item) || "-"}</td>
                        <td>{item?.sku || "-"}</td>
                        <td>{item?.brand || "-"}</td>
                        <td>{item?.quantity ?? 0}</td>
                        <td>{formatCurrency(item?.unit_price)}</td>
                        <td>
                          <span
                            className={`${styles.statusBadge} ${
                              normalizedStatus === "available"
                                ? styles.availableBadge
                                : normalizedStatus === "low_stock"
                                ? styles.lowStockBadge
                                : normalizedStatus === "out_of_stock"
                                ? styles.outOfStockBadge
                                : styles.defaultBadge
                            }`}
                          >
                            {prettyStatus(item?.status, item?.quantity)}
                          </span>
                        </td>
                        <td>{item?.supplier || "-"}</td>
                        <td>{item?.location || "-"}</td>
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