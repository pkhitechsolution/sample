import axios from "./axios";

const ACCOUNTS_BASE_URL = "/api/accounts/";

export const listAccounts = async (params = {}) => {
  return axios.get(ACCOUNTS_BASE_URL, { params });
};

export const getAccount = async (id) => {
  return axios.get(`${ACCOUNTS_BASE_URL}${id}/`);
};

export const createAccount = async (payload) => {
  return axios.post(ACCOUNTS_BASE_URL, payload);
};

export const updateAccount = async (id, payload) => {
  return axios.put(`${ACCOUNTS_BASE_URL}${id}/`, payload);
};

export const patchAccount = async (id, payload) => {
  return axios.patch(`${ACCOUNTS_BASE_URL}${id}/`, payload);
};

export const deleteAccount = async (id) => {
  return axios.delete(`${ACCOUNTS_BASE_URL}${id}/`);
};

export const getAccountsSummary = async () => {
  return axios.get(`${ACCOUNTS_BASE_URL}summary/`);
};

export const downloadAccountsTemplate = async () => {
  return axios.get(`${ACCOUNTS_BASE_URL}download-template/`, {
    responseType: "blob",
  });
};

export const uploadAccountsExcel = async (formData) => {
  return axios.post(`${ACCOUNTS_BASE_URL}upload-excel/`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const exportAccountsExcel = async () => {
  return axios.get(`${ACCOUNTS_BASE_URL}export-excel/`, {
    responseType: "blob",
  });
};

export const exportAccountsPdf = async () => {
  return axios.get(`${ACCOUNTS_BASE_URL}export-pdf/`, {
    responseType: "blob",
  });
};