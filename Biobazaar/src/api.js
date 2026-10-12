import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.MODE === "production"
    ? "https://biobazar.onrender.com"
    : "http://localhost:8001");

export const api = axios.create({ baseURL });

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
