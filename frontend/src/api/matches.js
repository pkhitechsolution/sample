import api from "./api";

const MATCHES_URL = "/api/matches/";

/* ================= LIST ================= */
export const getMatches = async (params = {}) => {
  const response = await api.get(MATCHES_URL, { params });
  return response.data;
};

/* ================= DETAIL ================= */
export const getMatchById = async (id) => {
  const response = await api.get(`${MATCHES_URL}${id}/`);
  return response.data;
};

/* ================= CREATE ================= */
export const createMatch = async (payload) => {
  const response = await api.post(MATCHES_URL, payload);
  return response.data;
};

/* ================= UPDATE ================= */
export const updateMatch = async (id, payload) => {
  const response = await api.put(`${MATCHES_URL}${id}/`, payload);
  return response.data;
};

/* ================= DELETE ================= */
export const deleteMatch = async (id) => {
  const response = await api.delete(`${MATCHES_URL}${id}/`);
  return response.data;
};

/* ================= DASHBOARD SUMMARY ================= */
export const getMatchesSummary = async () => {
  const response = await api.get(`${MATCHES_URL}dashboard-summary/`);
  return response.data;
};

/* ================= EXCEL / PDF ================= */
export const downloadMatchesTemplate = async () => {
  const response = await api.get(`${MATCHES_URL}download-template/`, {
    responseType: "blob",
  });
  return response;
};

export const exportMatchesExcel = async () => {
  const response = await api.get(`${MATCHES_URL}export-excel/`, {
    responseType: "blob",
  });
  return response;
};

export const exportMatchesPdf = async () => {
  const response = await api.get(`${MATCHES_URL}export-pdf/`, {
    responseType: "blob",
  });
  return response;
};

export const uploadMatchesExcel = async (formData) => {
  const response = await api.post(`${MATCHES_URL}upload-excel/`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};