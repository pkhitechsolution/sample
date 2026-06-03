import api from "./api";

// CRUD
export const listTalentProfiles = (params = {}) =>
  api.get("/api/talent/", { params });

export const getTalentProfile = (id) =>
  api.get(`/api/talent/${id}/`);

export const createTalentProfile = (payload) =>
  api.post("/api/talent/", payload);

export const updateTalentProfile = (id, payload) =>
  api.put(`/api/talent/${id}/`, payload);

export const patchTalentProfile = (id, payload) =>
  api.patch(`/api/talent/${id}/`, payload);

export const deleteTalentProfile = (id) =>
  api.delete(`/api/talent/${id}/`);

// Summary
export const getTalentSummary = () =>
  api.get("/api/talent/summary/");

// Import / Export
export const downloadTalentTemplate = () =>
  api.get("/api/talent/template/", { responseType: "blob" });

export const uploadTalentExcel = (formData) =>
  api.post("/api/talent/upload/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

export const exportTalentExcel = () =>
  api.get("/api/talent/export-excel/", { responseType: "blob" });

export const exportTalentPdf = () =>
  api.get("/api/talent/export-pdf/", { responseType: "blob" });