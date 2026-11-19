import axios from "axios";

export const API_URL = import.meta.env.VITE_CONCIERTO_BACKEND_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: API_URL,
  headers: { "ngrok-skip-browser-warning": "1" },
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const esLogin = error.config?.url?.includes("/auth/login");
    if (error.response?.status === 401 && !esLogin) {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("usuario");
      window.location.href = "/login?cerrada=1";
    }
    return Promise.reject(error);
  }
);

export default api;