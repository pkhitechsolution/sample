import axios from "./axios";

// List
export const listReports = (params = {}) =>
  axios.get("/api/reports/", { params });

// Single detail
export const getReport = (id) =>
  axios.get(`/api/reports/${id}/`);

// Summary
export const getReportsSummary = () =>
  axios.get("/api/reports/dashboard-summary/");

// Create
export const createReport = (data) =>
  axios.post("/api/reports/", data);

// Update
export const updateReport = (id, data) =>
  axios.put(`/api/reports/${id}/`, data);

// Delete
export const deleteReport = (id) =>
  axios.delete(`/api/reports/${id}/`);

// Export Excel
export const exportReportsExcel = () =>
  axios.get("/api/reports/export-excel/", {
    responseType: "blob",
  });

// Export PDF
export const exportReportsPdf = () =>
  axios.get("/api/reports/export-pdf/", {
    responseType: "blob",
  });

// Download template
export const downloadReportsTemplate = () =>
  axios.get("/api/reports/download-template/", {
    responseType: "blob",
  });

// Upload Excel
export const uploadReportsExcel = (formData) =>
  axios.post("/api/reports/upload-excel/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });