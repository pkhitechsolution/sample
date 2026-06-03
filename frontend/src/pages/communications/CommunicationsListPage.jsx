import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCommunicationMessages,
  getCommunicationSummary,
  deleteCommunicationMessage,
  sendCommunicationMessage,
  uploadCommunicationsExcel,
  downloadCommunicationsTemplate,
  exportCommunicationsExcel,
  exportCommunicationsPdf,
} from "../../api/communications";
import styles from "./CommunicationsListPage.module.css";

const PAGE_SIZE = 10;

function normalizeRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data?.results)) return payload.data.results;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
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
  const filename = match?.[1] || fallbackFilename;

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export default function CommunicationsListPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const exportMenuRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    draft: 0,
    scheduled: 0,
    sent: 0,
    failed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [audienceFilter, setAudienceFilter] = useState("");

  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);

      const params = {};
      if (search.trim()) params.search = search.trim();
      if (channelFilter) params.channel = channelFilter;
      if (statusFilter) params.status = statusFilter;
      if (audienceFilter) params.audience = audienceFilter;

      const [listRes, summaryRes] = await Promise.allSettled([
        getCommunicationMessages(params),
        getCommunicationSummary(),
      ]);

      if (listRes.status === "fulfilled") {
        setMessages(normalizeRows(listRes.value?.data ?? listRes.value));
      } else {
        console.error("Failed to load communications:", listRes.reason);
        setMessages([]);
      }

      if (summaryRes.status === "fulfilled") {
        setSummary({
          total: 0,
          draft: 0,
          scheduled: 0,
          sent: 0,
          failed: 0,
          ...(summaryRes.value?.data || {}),
        });
      } else {
        console.error("Failed to load communications summary:", summaryRes.reason);
        setSummary({
          total: 0,
          draft: 0,
          scheduled: 0,
          sent: 0,
          failed: 0,
        });
      }
    } catch (error) {
      console.error("Communications load error:", error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, channelFilter, statusFilter, audienceFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, channelFilter, statusFilter, audienceFilter]);

  useEffect(() => {
    const validIds = new Set(messages.map((item) => item.id));
    setSelectedIds((prev) => prev.filter((id) => validIds.has(id)));
  }, [messages]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const filteredRows = useMemo(() => messages, [messages]);

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

  const handleBulkEdit = () => {
    if (selectedIds.length !== 1) {
      alert("Please select exactly one communication to edit.");
      return;
    }
    navigate(`/communications/edit/${selectedIds[0]}`);
  };

  const handleBulkSend = async () => {
    if (!selectedIds.length) {
      alert("Please select at least one communication.");
      return;
    }

    const ok = window.confirm(
      `Send ${selectedIds.length} selected communication(s)?`
    );
    if (!ok) return;

    try {
      setActionLoading(true);
      await Promise.all(selectedIds.map((id) => sendCommunicationMessage(id)));
      await loadData();
      alert("Selected communications sent successfully.");
    } catch (error) {
      console.error("Send communications error:", error);
      alert("Failed to send selected communication(s).");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedIds.length) {
      alert("Please select at least one communication.");
      return;
    }

    const ok = window.confirm(
      `Delete ${selectedIds.length} selected communication(s)?`
    );
    if (!ok) return;

    try {
      setActionLoading(true);
      await Promise.all(selectedIds.map((id) => deleteCommunicationMessage(id)));
      setSelectedIds([]);
      await loadData();
    } catch (error) {
      console.error("Delete communications error:", error);
      alert("Failed to delete selected communication(s).");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
    setShowExportMenu(false);
  };

  const handleExcelFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setActionLoading(true);
      await uploadCommunicationsExcel(file);
      await loadData();
      alert("Excel uploaded successfully.");
    } catch (error) {
      console.error("Excel upload failed:", error);
      const apiError = error?.response?.data || {};
      alert(apiError?.detail || "Excel upload failed.");
    } finally {
      event.target.value = "";
      setActionLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setActionLoading(true);
      const response = await downloadCommunicationsTemplate();
      downloadBlobFile(response, "communications_template.xlsx");
      setShowExportMenu(false);
    } catch (error) {
      console.error("Template download failed:", error);
      alert("Template download failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      setActionLoading(true);
      const response = await exportCommunicationsExcel();
      downloadBlobFile(response, "communications_export.xlsx");
      setShowExportMenu(false);
    } catch (error) {
      console.error("Excel download failed:", error);
      alert("Excel download failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setActionLoading(true);
      const response = await exportCommunicationsPdf();
      downloadBlobFile(response, "communications_report.pdf");
      setShowExportMenu(false);
    } catch (error) {
      console.error("PDF download failed:", error);
      alert("PDF download failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusClass = (status) => {
    const normalized = String(status || "").toLowerCase();

    if (normalized === "sent") return `${styles.statusBadge} ${styles.statusSent}`;
    if (normalized === "draft") return `${styles.statusBadge} ${styles.statusDraft}`;
    if (normalized === "scheduled") return `${styles.statusBadge} ${styles.statusScheduled}`;
    if (normalized === "failed") return `${styles.statusBadge} ${styles.statusFailed}`;
    return `${styles.statusBadge} ${styles.statusDefault}`;
  };

  const getChannelClass = (channel) => {
    const normalized = String(channel || "").toLowerCase();

    if (normalized === "notice") return `${styles.statusBadge} ${styles.channelNotice}`;
    if (normalized === "email") return `${styles.statusBadge} ${styles.channelEmail}`;
    if (normalized === "sms") return `${styles.statusBadge} ${styles.channelSms}`;
    if (normalized === "whatsapp") return `${styles.statusBadge} ${styles.channelWhatsapp}`;
    if (normalized === "press_release") return `${styles.statusBadge} ${styles.channelPress}`;
    return `${styles.statusBadge} ${styles.channelDefault}`;
  };

  const allChannels = useMemo(
    () => [...new Set(messages.map((item) => item?.channel).filter(Boolean))],
    [messages]
  );

  const allStatuses = useMemo(
    () => [...new Set(messages.map((item) => item?.status).filter(Boolean))],
    [messages]
  );

  const allAudiences = useMemo(
    () => [...new Set(messages.map((item) => item?.audience).filter(Boolean))],
    [messages]
  );

  return (
    <div className={styles.page}>
      <div className={styles.heroCard}>
        <div className={styles.heroBadge}>SPORTS TALENT MANAGEMENT</div>
        <h1 className={styles.heroTitle}>Communications Management</h1>
        <p className={styles.heroSubtitle}>
          Create, manage, send, and monitor notices, announcements, and message workflows with a compact professional layout.
        </p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>TOTAL COMMUNICATIONS</div>
          <div className={styles.statValue}>{summary.total}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>DRAFT</div>
          <div className={styles.statValue}>{summary.draft}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>SENT</div>
          <div className={styles.statValue}>{summary.sent}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>FAILED</div>
          <div className={styles.statValue}>{summary.failed}</div>
        </div>
      </div>

      <div className={styles.sectionCard}>
        <div className={styles.sectionTop}>
          <div className={styles.sectionTitleWrap}>
            <h2 className={styles.sectionTitle}>Communications List</h2>
            <p className={styles.sectionSubtitle}>
              Search, filter, edit, upload, export, send, and maintain communication records.
            </p>
          </div>

          <div className={styles.topActions}>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => navigate("/communications/add")}
            >
              Add New
            </button>

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
                  <button type="button" className={styles.dropdownItem} onClick={handleDownloadTemplate}>
                    Download Template
                  </button>
                  <button type="button" className={styles.dropdownItem} onClick={handleDownloadExcel}>
                    Download Excel
                  </button>
                  <button type="button" className={styles.dropdownItem} onClick={handleDownloadPdf}>
                    Download PDF
                  </button>
                </div>
              ) : null}

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className={styles.hiddenFileInput}
                onChange={handleExcelFileChange}
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
                  className={styles.bulkSendBtn}
                  onClick={handleBulkSend}
                  disabled={actionLoading}
                >
                  Send
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
              Select one or more communications to use common actions above.
            </div>
          )}
        </div>

        <div className={styles.filtersRow}>
          <input
            type="text"
            placeholder="Search by title, message, audience..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />

          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">All Channels</option>
            {allChannels.map((item) => (
              <option key={item} value={item}>
                {String(item).replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">All Status</option>
            {allStatuses.map((item) => (
              <option key={item} value={item}>
                {String(item).replace(/\b\w/g, (c) => c.toUpperCase())}
              </option>
            ))}
          </select>

          <select
            value={audienceFilter}
            onChange={(e) => setAudienceFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">All Audience</option>
            {allAudiences.map((item) => (
              <option key={item} value={item}>
                {String(item).replace(/\b\w/g, (c) => c.toUpperCase())}
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
                  <th>TITLE</th>
                  <th>CHANNEL</th>
                  <th>AUDIENCE</th>
                  <th>MESSAGE</th>
                  <th>CREATED ON</th>
                  <th>STATUS</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className={styles.emptyRow}>
                      Loading communications...
                    </td>
                  </tr>
                ) : paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan="8" className={styles.emptyRow}>
                      No communications found.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((item, index) => {
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

                        <td className={styles.titleCell}>
                          {item.title || "-"}
                        </td>

                        <td>
                          <span className={getChannelClass(item.channel)}>
                            {item.channel_label || item.channel || "-"}
                          </span>
                        </td>

                        <td>{item.audience_label || item.audience || "-"}</td>

                        <td className={styles.messageCell}>
                          <div className={styles.messagePreview}>
                            {item.message || "-"}
                          </div>
                        </td>

                        <td>{formatDateTime(item.created_at)}</td>

                        <td>
                          <span className={getStatusClass(item.status)}>
                            {item.status_label || item.status || "-"}
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