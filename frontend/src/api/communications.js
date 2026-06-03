import api from "./axios";

/* =========================
   Summary
========================= */
export const getCommunicationSummary = () =>
  api.get("/api/communications/summary/");

/* =========================
   Messages CRUD
========================= */
export const getCommunicationMessages = (params = {}) =>
  api.get("/api/communications/messages/", { params });

export const getCommunicationMessage = (id) =>
  api.get(`/api/communications/messages/${id}/`);

export const createCommunicationMessage = (payload) =>
  api.post("/api/communications/messages/", payload);

export const updateCommunicationMessage = (id, payload) =>
  api.put(`/api/communications/messages/${id}/`, payload);

export const patchCommunicationMessage = (id, payload) =>
  api.patch(`/api/communications/messages/${id}/`, payload);

export const deleteCommunicationMessage = (id) =>
  api.delete(`/api/communications/messages/${id}/`);

export const sendCommunicationMessage = (id) =>
  api.post(`/api/communications/messages/${id}/send/`);

export const saveCommunicationAsDraft = (id) =>
  api.post(`/api/communications/messages/${id}/save-as-draft/`);

/* =========================
   Upload / Export
========================= */
export const uploadCommunicationsExcel = (file) => {
  const formData = new FormData();
  formData.append("excel_file", file);
  return api.post("/api/communications/upload/excel/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const downloadCommunicationsTemplate = () =>
  api.get("/api/communications/template/download/", {
    responseType: "blob",
  });

export const exportCommunicationsExcel = () =>
  api.get("/api/communications/export/excel/", {
    responseType: "blob",
  });

export const exportCommunicationsPdf = () =>
  api.get("/api/communications/export/pdf/", {
    responseType: "blob",
  });

/* =========================
   Backward-compatible aliases
========================= */
export const getCommunications = getCommunicationMessages;
export const getCommunication = getCommunicationMessage;
export const createCommunication = createCommunicationMessage;
export const updateCommunication = updateCommunicationMessage;
export const patchCommunication = patchCommunicationMessage;
export const deleteCommunication = deleteCommunicationMessage;
export const sendCommunication = sendCommunicationMessage;