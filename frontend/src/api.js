import axios from "axios";

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api" });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export function errorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (!error.response) return "Unable to reach JobTracker. Check that the backend is running.";
  return error.response.data?.message || fallback;
}
export default api;
