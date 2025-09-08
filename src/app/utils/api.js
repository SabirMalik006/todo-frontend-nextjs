import axios from "axios";

const api = axios.create({
  baseURL: "https://todo-backend-w-nextjs-production.up.railway.app/", 
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
