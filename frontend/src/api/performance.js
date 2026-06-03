import api from "./axios";

export const listPerformanceRecords = () => api.get("/api/performance/");

export const getPerformanceRecord = (id) => api.get(`/api/performance/${id}/`);

export const createPerformanceRecord = (data) =>
  api.post("/api/performance/", data);

export const updatePerformanceRecord = (id, data) =>
  api.put(`/api/performance/${id}/`, data);

export const deletePerformanceRecord = (id) =>
  api.delete(`/api/performance/${id}/`);

export const getPerformanceSummary = () => api.get("/api/performance/summary/");

export const downloadPerformanceTemplate = () =>
  api.get("/api/performance/download-template/", {
    responseType: "blob",
  });

export const uploadPerformanceExcel = (formData) =>
  api.post("/api/performance/upload-excel/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

export const exportPerformanceExcel = () =>
  api.get("/api/performance/export-excel/", {
    responseType: "blob",
  });

export const exportPerformancePdf = () =>
  api.get("/api/performance/export-pdf/", {
    responseType: "blob",
  });