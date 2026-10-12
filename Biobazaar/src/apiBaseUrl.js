export const PRODUCTION_API_BASE_URL = "https://biobazar.onrender.com";
export const DEVELOPMENT_API_BASE_URL = "http://localhost:8001";

export const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || (
  import.meta.env?.PROD
    ? PRODUCTION_API_BASE_URL
    : DEVELOPMENT_API_BASE_URL
);
