import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./MediaListPage.module.css";
import {
  listMediaItems,
  deleteMediaItem,
  getMediaSummary,
  downloadMediaTemplate,
  uploadMediaExcel,
  exportMediaExcel,
  exportMediaPdf,
} from "../../api/media";

const PAGE_SIZE = 10;

function getRowsFromResponse(response) {
  const data = response?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
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

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function prettifyValue(value) {
  if (!value) return "-";
  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getStatusClass(status, styles) {
  switch (String(status || "").toLowerCase()) {
    case "active":
      return `${styles.statusBadge} ${styles.statusActive}`;
    case "draft":
      return `${styles.statusBadge} ${styles.statusDraft}`;
    case "archived":
      return `${styles.statusBadge} ${styles.statusArchived}`;
    default:
      return `${styles.statusBadge} ${styles.statusDefault}`;
  }
}

function getTypeClass(type, styles) {
  switch (String(type || "").toLowerCase()) {
    case "image":
      return `${styles.typeBadge} ${styles.typeImage}`;
    case "video":
      return `${styles.typeBadge} ${styles.typeVideo}`;
    case "document":
      return `${styles.typeBadge} ${styles.typeDocument}`;
    case "audio":
      return `${styles.typeBadge} ${styles.typeAudio}`;
    default:
      return `${styles.typeBadge} ${styles.typeDefault}`;
  }
}

function getVisibilityClass(visibility, styles) {
  switch (String(visibility || "").toLowerCase()) {
    case "public":
      return `${styles.visibilityBadge} ${styles.visibilityPublic}`;
    case "private":
      return `${styles.visibilityBadge} ${styles.visibilityPrivate}`;
    case "team":
      return `${styles.visibilityBadge} ${styles.visibilityTeam}`;
    default:
      return `${styles.visibilityBadge} ${styles.visibilityDefault}`;
  }
}

export default function MediaListPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const exportMenuRef = useRef(null);

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("");

  const [selectedIds, setSelectedIds] = useState([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorText("");

      const [listRes, summaryRes] = await Promise.all([
        listMediaItems(),
        getMediaSummary(),
      ]);

      setRows(getRowsFromResponse(listRes));
      setSummary(summaryRes?.data || {});
    } catch (error) {
      setRows([]);
      setSummary({});
      setErrorText(
        error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Failed to load media records."
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
    return () =>
      document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();

    return rows.filter((item) => {
      const matchesSearch =
        !q ||
        String(item?.title || "").toLowerCase().includes(q) ||
        String(item?.event_name || "").toLowerCase().includes(q) ||
        String(item?.sport_name || "").toLowerCase().includes(q) ||
        String(item?.media_type || "").toLowerCase().includes(q) ||
        String(item?.visibility || "").toLowerCase().includes(q) ||
        String(item?.status || "").toLowerCase().includes(q) ||
        String(item?.category_name || "").toLowerCase().includes(q) ||
        String(item?.description || "").toLowerCase().includes(q);

      const matchesType = !typeFilter || item?.media_type === typeFilter;
      const matchesStatus = !statusFilter || item?.status === statusFilter;
      const matchesVisibility =
        !visibilityFilter || item?.visibility === visibilityFilter;

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus &&
        matchesVisibility
      );
    });
  }, [rows, search, typeFilter, statusFilter, visibilityFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter, statusFilter, visibilityFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
  const paginatedRows = filteredRows.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );

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
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
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
      alert("Please select at least one media item.");
      return;
    }

    const ok = window.confirm(
      `Are you sure you want to delete ${selectedIds.length} selected media item(s)?`
    );
    if (!ok) return;

    try {
      setActionLoading(true);
      await Promise.all(selectedIds.map((id) => deleteMediaItem(id)));
      setSelectedIds([]);
      await loadData();
    } catch (error) {
      alert(
        error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Failed to delete selected media items."
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
    navigate(`/media/edit/${selectedIds[0]}`);
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
      await uploadMediaExcel(file);
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

  const handleTemplateDownload = async () => {
    try {
      setActionLoading(true);
      const response = await downloadMediaTemplate();
      downloadBlobFile(response, "media_template.xlsx");
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
      const response = await exportMediaExcel();
      downloadBlobFile(response, "media_export.xlsx");
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
      const response = await exportMediaPdf();
      downloadBlobFile(response, "media_report.pdf");
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

  return (
    <div className={styles.page}>
      <div className={styles.heroCard}>
        <div className={styles.heroBadge}>SPORTS TALENT MANAGEMENT</div>
        <h1 className={styles.heroTitle}>Media Management</h1>
        <p className={styles.heroSubtitle}>
          Create, manage, upload, export, and monitor photos, videos,
          documents, and sports media assets in one place.
        </p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>TOTAL MEDIA</p>
          <h3 className={styles.statValue}>{summary?.total_media ?? 0}</h3>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>IMAGES</p>
          <h3 className={styles.statValue}>{summary?.images ?? 0}</h3>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>VIDEOS</p>
          <h3 className={styles.statValue}>{summary?.videos ?? 0}</h3>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>PUBLISHED</p>
          <h3 className={styles.statValue}>{summary?.published ?? 0}</h3>
        </div>
      </div>

      <div className={styles.sectionCard}>
        <div className={styles.sectionTop}>
          <div className={styles.sectionTitleWrap}>
            <h2 className={styles.sectionTitle}>Media List</h2>
            <p className={styles.sectionSubtitle}>
              Search, filter, upload, export, edit, and maintain all media records with common actions on top.
            </p>
          </div>

          <div className={styles.topActions}>
            <Link to="/media/add" className={styles.primaryBtn}>
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

              {showExportMenu && (
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
              )}

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
              Select one or more rows to use common actions above.
            </div>
          )}
        </div>

        <div className={styles.filtersRow}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by title, event, sport, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className={styles.filterSelect}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="document">Document</option>
            <option value="audio">Audio</option>
          </select>

          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>

          <select
            className={styles.filterSelect}
            value={visibilityFilter}
            onChange={(e) => setVisibilityFilter(e.target.value)}
          >
            <option value="">All Visibility</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="team">Team</option>
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
                  <th>TITLE</th>
                  <th>CATEGORY</th>
                  <th>TYPE</th>
                  <th>EVENT</th>
                  <th>SPORT</th>
                  <th>VISIBILITY</th>
                  <th>STATUS</th>
                  <th>PUBLISHED</th>
                  <th>CREATED ON</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="11" className={styles.emptyRow}>
                      Loading media records...
                    </td>
                  </tr>
                ) : paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan="11" className={styles.emptyRow}>
                      No media records found.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((item, index) => {
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

                        <td>
                          <div className={styles.mainText}>{item?.title || "-"}</div>
                          <div className={styles.subText}>
                            {item?.description || item?.category_name || "-"}
                          </div>
                        </td>

                        <td>{item?.category_name || "-"}</td>

                        <td>
                          <span className={getTypeClass(item?.media_type, styles)}>
                            {prettifyValue(item?.media_type)}
                          </span>
                        </td>

                        <td>{item?.event_name || "-"}</td>
                        <td>{item?.sport_name || "-"}</td>

                        <td>
                          <span
                            className={getVisibilityClass(item?.visibility, styles)}
                          >
                            {prettifyValue(item?.visibility)}
                          </span>
                        </td>

                        <td>
                          <span className={getStatusClass(item?.status, styles)}>
                            {prettifyValue(item?.status)}
                          </span>
                        </td>

                        <td>{item?.is_published ? "Yes" : "No"}</td>
                        <td>{formatDate(item?.created_at)}</td>
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