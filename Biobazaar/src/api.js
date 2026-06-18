import axios from "axios";

export const api = axios.create({
  baseURL: "https://biobazaar-backend.onrender.com" 
});