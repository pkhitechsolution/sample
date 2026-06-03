import api from "./axios";

export const listMediaItems = (params = {}) =>
  api.get("/api/media/", { params });

export const getMediaItem = (id) =>
  api.get(`/api/media/${id}/`);

export const createMediaItem = (payload) =>
  api.post("/api/media/", payload, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const updateMediaItem = (id, payload) =>
  api.put(`/api/media/${id}/`, payload, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const patchMediaItem = (id, payload) =>
  api.patch(`/api/media/${id}/`, payload, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const deleteMediaItem = (id) =>
  api.delete(`/api/media/${id}/`);

export const getMediaCategories = () =>
  api.get("/api/media/categories/");

export const getMediaSummary = () =>
  api.get("/api/media/dashboard-summary/");

export const downloadMediaTemplate = () =>
  api.get("/api/media/download-template/", {
    responseType: "blob",
  });

export const uploadMediaExcel = (fileOrFormData) => {
  const formData =
    fileOrFormData instanceof FormData
      ? fileOrFormData
      : (() => {
          const fd = new FormData();
          fd.append("excel_file", fileOrFormData);
          return fd;
        })();

  return api.post("/api/media/upload-excel/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const exportMediaExcel = () =>
  api.get("/api/media/export-excel/", {
    responseType: "blob",
  });

export const exportMediaPdf = () =>
  api.get("/api/media/export-pdf/", {
    responseType: "blob",
  });