import axios from "axios";
import { toast } from "sonner";
import { store } from "@/app/store"; 
import { logout } from "@/features/auth/authSlice";

const apiFetch = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

apiFetch.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("stayfinder_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData && config.headers) {
      if (typeof config.headers.delete === "function") {
        config.headers.delete("Content-Type");
        config.headers.delete("content-type");
      } else {
        delete config.headers["Content-Type"];
        delete config.headers["content-type"];
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiFetch.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || "Something went wrong";

    if (status === 401) {
      store.dispatch(logout());
      localStorage.removeItem("stayfinder_token");
      toast.error("Session expired. Please log in again.");

      // Optional: Force redirect to home page
      window.location.href = "/";
    } else if (status >= 500) {
      toast.error("Server error. Please try again later.");
    }

    return Promise.reject(error);
  },
);

export default apiFetch;

export const apiGet = async (url: string, params = {}) => {
  const response = await apiFetch.get(url, { params });
  return response.data;
};

export const apiPost = async (url: string, body?: any) => {
  const response = await apiFetch.post(url, body);
  return response.data;
};
