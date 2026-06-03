import axios from "axios";

const API_BASE = "http://127.0.0.1:8000/api/sports/";

export const getSports = async () => {
  const response = await axios.get(API_BASE);
  return response.data;
};

export const createSport = async (data) => {
  const response = await axios.post(API_BASE, data);
  return response.data;
};

export const updateSport = async (id, data) => {
  const response = await axios.put(`${API_BASE}${id}/`, data);
  return response.data;
};

export const deleteSport = async (id) => {
  const response = await axios.delete(`${API_BASE}${id}/`);
  return response.data;
};