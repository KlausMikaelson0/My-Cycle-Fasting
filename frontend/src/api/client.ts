import axios from "axios";

import { STORAGE_TOKEN_KEY } from "../utils/constants";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

export const apiClient = axios.create({
  baseURL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
