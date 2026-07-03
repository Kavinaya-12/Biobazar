import axios from "axios";
import store from "./redux/store";
import { logout } from "./redux/authSlice";

const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.MODE === "production"
    ? "https://biobazaar-backend.onrender.com"
    : "http://localhost:8000");

console.debug("API baseURL:", baseURL);

export const api = axios.create({
  baseURL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear only authentication-related storage to avoid wiping other app state
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("userEmail");
      store.dispatch(logout());
      // redirect to login
      try {
        window.location.href = "/login";
      } catch (e) {
        /* ignore if not available */
      }
    }

    return Promise.reject(error);
  }
);