import api from "./axios";

export const listGrants = () => api.get("/api/grants/");

export const getGrant = (id) => api.get(`/api/grants/${id}/`);

export const createGrant = (data) => api.post("/api/grants/", data);

export const updateGrant = (id, data) => api.put(`/api/grants/${id}/`, data);

export const deleteGrant = (id) => api.delete(`/api/grants/${id}/`);

export const getGrantsSummary = () => api.get("/api/grants/summary/");

export const downloadGrantTemplate = () =>
  api.get("/api/grants/download-template/", {
    responseType: "blob",
  });

export const uploadGrantsExcel = (formData) =>
  api.post("/api/grants/upload-excel/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

export const exportGrantsExcel = () =>
  api.get("/api/grants/export-excel/", {
    responseType: "blob",
  });

export const exportGrantsPdf = () =>
  api.get("/api/grants/export-pdf/", {
    responseType: "blob",
  });