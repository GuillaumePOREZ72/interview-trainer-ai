import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import { BASE_URL, API_PATHS } from "./apiPaths";

const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 80000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true, // Send cookies with requests
});

// Request Interceptor
axiosInstance.interceptors.request.use((config) => {
  const language = localStorage.getItem("i18nextLng") || "en";
  (config.headers as any)["Accept-Language"] = language;

  // Let the browser set Content-Type automatically for FormData (multipart/form-data with boundary)
  if (config.data instanceof FormData) {
    delete (config.headers as any)["Content-Type"];
  }
  return config;
});

let refreshPromise: Promise<void> | null = null;

const refresh = async () => {
  await axiosInstance.post(API_PATHS.AUTH.REFRESH_TOKEN);
};

// Response Interceptor with automatic token refresh
axiosInstance.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If error is not 401 or request already retried, reject
    if (!error.response || error.response.status !== 401) throw error;
    if (!originalRequest || originalRequest._retry) throw error;

    // If refresh itself fails, redirect to login
    if (originalRequest.url === API_PATHS.AUTH.REFRESH_TOKEN) throw error;

    originalRequest._retry = true;

    try {
      // ONe refresh at a time
      if (!refreshPromise) {
        refreshPromise = refresh().finally(() => {
          refreshPromise = null;
        });
      }
      await refreshPromise;

      // Retry original request
      return axiosInstance(originalRequest);
    } catch (error) {
      // Hard reset: user will be cleared on next /profile
      window.location.href = "/"; // Redirect to home/login
      throw error;
    }
  },
);

export default axiosInstance;
