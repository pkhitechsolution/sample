import api from "./axios";

export const listInventoryItems = (params = {}) =>
  api.get("/api/inventory/", { params });

export const getInventoryItems = (params = {}) =>
  api.get("/api/inventory/", { params });

export const getInventoryItem = (id) =>
  api.get(`/api/inventory/${id}/`);

export const createInventoryItem = (payload) =>
  api.post("/api/inventory/", payload);

export const updateInventoryItem = (id, payload) =>
  api.put(`/api/inventory/${id}/`, payload);

export const patchInventoryItem = (id, payload) =>
  api.patch(`/api/inventory/${id}/`, payload);

export const deleteInventoryItem = (id) =>
  api.delete(`/api/inventory/${id}/`);

export const getInventoryCategories = () =>
  api.get("/api/inventory/categories/");

export const getInventorySummary = () =>
  api.get("/api/inventory/dashboard-summary/");

export const getInventoryDashboardSummary = () =>
  api.get("/api/inventory/dashboard-summary/");

export const downloadInventoryTemplate = () =>
  api.get("/api/inventory/download-template/", {
    responseType: "blob",
  });

export const uploadInventoryExcel = (fileOrFormData) => {
  const formData =
    fileOrFormData instanceof FormData
      ? fileOrFormData
      : (() => {
          const fd = new FormData();
          fd.append("excel_file", fileOrFormData);
          return fd;
        })();

  return api.post("/api/inventory/upload-excel/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const exportInventoryExcel = () =>
  api.get("/api/inventory/export-excel/", {
    responseType: "blob",
  });

export const exportInventoryPdf = () =>
  api.get("/api/inventory/export-pdf/", {
    responseType: "blob",
  });