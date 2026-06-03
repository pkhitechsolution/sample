import api from "./api";

const TOURNAMENTS_URL = "/api/tournaments/";
const TOURNAMENTS_SUMMARY_URL = "/api/tournaments/dashboard-summary/";
const TOURNAMENTS_TEMPLATE_URL = "/api/tournaments/download-template/";
const TOURNAMENTS_UPLOAD_URL = "/api/tournaments/upload-excel/";
const TOURNAMENTS_EXPORT_EXCEL_URL = "/api/tournaments/export-excel/";
const TOURNAMENTS_EXPORT_PDF_URL = "/api/tournaments/export-pdf/";

/* ================= LIST ================= */
export const getAllTournaments = async (params = {}) => {
  const response = await api.get(TOURNAMENTS_URL, { params });
  return response.data;
};

export const getTournaments = getAllTournaments;

/* ================= DETAIL ================= */
export const getTournamentById = async (id) => {
  const response = await api.get(`${TOURNAMENTS_URL}${id}/`);
  return response.data;
};

/* ================= CREATE ================= */
export const createTournament = async (payload) => {
  const response = await api.post(TOURNAMENTS_URL, payload);
  return response.data;
};

/* ================= UPDATE ================= */
export const updateTournament = async (id, payload) => {
  const response = await api.put(`${TOURNAMENTS_URL}${id}/`, payload);
  return response.data;
};

/* ================= PATCH UPDATE ================= */
export const patchTournament = async (id, payload) => {
  const response = await api.patch(`${TOURNAMENTS_URL}${id}/`, payload);
  return response.data;
};

/* ================= DELETE ================= */
export const deleteTournament = async (id) => {
  const response = await api.delete(`${TOURNAMENTS_URL}${id}/`);
  return response.data;
};

/* ================= SUMMARY ================= */
export const getTournamentSummary = async () => {
  const response = await api.get(TOURNAMENTS_SUMMARY_URL);
  return response.data;
};

/* ================= TEMPLATE DOWNLOAD ================= */
export const downloadTournamentTemplate = async () => {
  const response = await api.get(TOURNAMENTS_TEMPLATE_URL, {
    responseType: "blob",
  });
  return response;
};

/* ================= EXCEL UPLOAD ================= */
export const uploadTournamentExcel = async (formData) => {
  const response = await api.post(TOURNAMENTS_UPLOAD_URL, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

/* ================= EXCEL EXPORT ================= */
export const exportTournamentExcel = async () => {
  const response = await api.get(TOURNAMENTS_EXPORT_EXCEL_URL, {
    responseType: "blob",
  });
  return response;
};

/* ================= PDF EXPORT ================= */
export const exportTournamentPdf = async () => {
  const response = await api.get(TOURNAMENTS_EXPORT_PDF_URL, {
    responseType: "blob",
  });
  return response;
};

/* ================= TOURNAMENT TEAMS ================= */
export const getTournamentTeams = async (id, params = {}) => {
  const response = await api.get(`${TOURNAMENTS_URL}${id}/teams/`, {
    params,
  });
  return response.data;
};

/* ================= GENERATE FIXTURES ================= */
export const generateTournamentFixtures = async (id, payload = {}) => {
  const response = await api.post(
    `${TOURNAMENTS_URL}${id}/generate-fixtures/`,
    payload
  );
  return response.data;
};

/* ================= GET TOURNAMENT FIXTURES ================= */
export const getTournamentFixtures = async (id, params = {}) => {
  const response = await api.get(`${TOURNAMENTS_URL}${id}/fixtures/`, {
    params,
  });
  return response.data;
};

/* ================= PATCH TOURNAMENT MATCH ================= */
export const patchTournamentMatch = async (matchId, payload) => {
  const response = await api.patch(`/api/matches/${matchId}/`, payload);
  return response.data;
};