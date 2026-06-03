import api from "./api";

const normalizeListResponse = (data) => {
  if (Array.isArray(data)) {
    return {
      results: data,
      count: data.length,
      next: null,
      previous: null,
    };
  }

  return {
    results: Array.isArray(data?.results) ? data.results : [],
    count: Number(data?.count || 0),
    next: data?.next ?? null,
    previous: data?.previous ?? null,
  };
};

export const getAllTeams = async (params = {}) => {
  const response = await api.get("/api/teams/", { params });
  return normalizeListResponse(response.data);
};

export const getTeams = async (params = {}) => {
  const response = await api.get("/api/teams/", { params });
  return normalizeListResponse(response.data);
};

export const getTeamById = async (id) => {
  const response = await api.get(`/api/teams/${id}/`);
  return response.data;
};

export const createTeam = async (payload) => {
  const response = await api.post("/api/teams/", payload);
  return response.data;
};

export const updateTeam = async (id, payload) => {
  const response = await api.put(`/api/teams/${id}/`, payload);
  return response.data;
};

export const patchTeam = async (id, payload) => {
  const response = await api.patch(`/api/teams/${id}/`, payload);
  return response.data;
};

export const deleteTeam = async (id) => {
  const response = await api.delete(`/api/teams/${id}/`);
  return response.data;
};

export const getTeamsSummary = async () => {
  try {
    const response = await api.get("/api/teams/summary/");
    return response.data;
  } catch (error) {
    const list = await getAllTeams();
    const rows = Array.isArray(list?.results) ? list.results : [];

    const total_teams = rows.length;
    const active_teams = rows.filter(
      (item) => String(item.status || "").toLowerCase() === "active"
    ).length;
    const inactive_teams = rows.filter(
      (item) => String(item.status || "").toLowerCase() === "inactive"
    ).length;
    const full_teams = rows.filter(
      (item) =>
        Number(item.current_players_count || 0) >=
        Number(item.max_players || 0)
    ).length;

    return {
      total_teams,
      active_teams,
      inactive_teams,
      full_teams,
    };
  }
};

export const uploadTeamsExcel = async (formDataOrFile) => {
  const formData =
    formDataOrFile instanceof FormData ? formDataOrFile : new FormData();

  if (!(formDataOrFile instanceof FormData)) {
    formData.append("file", formDataOrFile);
  }

  const response = await api.post("/api/teams/upload-excel/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const downloadTeamsTemplate = async () => {
  return api.get("/api/teams/download-template/", {
    responseType: "blob",
  });
};

export const exportTeamsExcel = async () => {
  return api.get("/api/teams/export-excel/", {
    responseType: "blob",
  });
};

export const exportTeamsPdf = async () => {
  return api.get("/api/teams/export-pdf/", {
    responseType: "blob",
  });
};