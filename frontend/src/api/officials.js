import api from "./api";

const OFFICIALS_URL = "/api/officials/";

export const getOfficials = async (params = {}) => {
  const response = await api.get(OFFICIALS_URL, { params });
  return response.data;
};

export const getOfficialsSummary = async () => {
  try {
    const response = await api.get(`${OFFICIALS_URL}summary/`);
    return response.data;
  } catch (error) {
    if (error?.response?.status === 404) {
      const fallbackResponse = await api.get(`${OFFICIALS_URL}dashboard-summary/`);
      return fallbackResponse.data;
    }
    throw error;
  }
};

export const getOfficialById = async (id) => {
  const response = await api.get(`${OFFICIALS_URL}${id}/`);
  return response.data;
};

export const createOfficial = async (payload) => {
  const response = await api.post(OFFICIALS_URL, payload);
  return response.data;
};

export const updateOfficial = async (id, payload) => {
  const response = await api.put(`${OFFICIALS_URL}${id}/`, payload);
  return response.data;
};

export const patchOfficial = async (id, payload) => {
  const response = await api.patch(`${OFFICIALS_URL}${id}/`, payload);
  return response.data;
};

export const deleteOfficial = async (id) => {
  const response = await api.delete(`${OFFICIALS_URL}${id}/`);
  return response.data;
};

export const uploadOfficialsExcel = async (formDataOrFile) => {
  const formData =
    formDataOrFile instanceof FormData ? formDataOrFile : new FormData();

  if (!(formDataOrFile instanceof FormData) && formDataOrFile) {
    formData.append("file", formDataOrFile);
  }

  if (formData instanceof FormData && !formData.get("file") && formData.get("excel_file")) {
    const excelFile = formData.get("excel_file");
    formData.delete("excel_file");
    formData.append("file", excelFile);
  }

  const response = await api.post(`${OFFICIALS_URL}upload-excel/`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const downloadOfficialsTemplate = async () => {
  try {
    return await api.get(`${OFFICIALS_URL}download-template/`, {
      responseType: "blob",
    });
  } catch (error) {
    if (error?.response?.status === 404) {
      return await api.get(`${OFFICIALS_URL}upload-template/`, {
        responseType: "blob",
      });
    }
    throw error;
  }
};

export const exportOfficialsExcel = async () => {
  return await api.get(`${OFFICIALS_URL}export-excel/`, {
    responseType: "blob",
  });
};

export const exportOfficialsPdf = async () => {
  return await api.get(`${OFFICIALS_URL}export-pdf/`, {
    responseType: "blob",
  });
};