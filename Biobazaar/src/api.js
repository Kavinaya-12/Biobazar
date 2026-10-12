import axios from "axios";
import { API_BASE_URL } from "./apiBaseUrl.js";

export const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use(
  (config) => {
    let token = null;
    try { token = localStorage.getItem("token"); } catch { token = null; }
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Do not import the Redux store here: productSlice imports this module, so that
// would create a store -> productSlice -> api -> store circular dependency.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const authorization = error.config?.headers?.Authorization || error.config?.headers?.authorization;
    if (error.response?.status === 401 && authorization && typeof window !== "undefined") {
      const token = String(authorization).replace(/^Bearer\s+/i, "");
      window.dispatchEvent(new CustomEvent("biobazaar:session-invalid", { detail: { token } }));
    }
    return Promise.reject(error);
  }
);
