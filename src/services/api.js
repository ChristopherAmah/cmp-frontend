import axios from "axios";

const configuredApiUrl =
  import.meta.env.VITE_API_URL || "http://localhost:5001/api";
const API_URL = configuredApiUrl.replace(/\/$/, "").endsWith("/api")
  ? configuredApiUrl.replace(/\/$/, "")
  : `${configuredApiUrl.replace(/\/$/, "")}/api`;

const API_LOGS = true; // Enable debugging in dev; leave on for now to help diagnose auth issues

// Global Axios instance – uses httpOnly auth cookies and (optionally) Bearer tokens
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // send credentials (cookies) with every request
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 second timeout for all requests
});

// Request interceptor for auth + logging / metadata
api.interceptors.request.use((config) => {
  config.metadata = { startTime: performance.now() };

  // Also support Bearer token from localStorage for environments where cookies may not be sent
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (API_LOGS) {
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    console.log(
      `[API Request] Auth: cookies=withCredentials, bearerToken=${
        token ? "present" : "missing"
      }`
    );
  }
  return config;
});

// Response interceptor to log duration and debug
api.interceptors.response.use(
  (response) => {
    if (API_LOGS) {
      const start = response.config?.metadata?.startTime;
      const duration =
        typeof start === "number"
          ? Math.round(performance.now() - start)
          : undefined;
      const method = response.config?.method?.toUpperCase() || "GET";
      const url = response.config?.url || "";
      console.log(
        `[API] ${method} ${url}${
          duration !== undefined ? ` - ${duration}ms` : ""
        }`
      );
      console.log(`[API Response] Status: ${response.status}`);
      // In browsers, Set-Cookie headers are not directly exposed to JS for security reasons.
      // The browser will still store httpOnly cookies automatically.
    }
    return response;
  },
  (error) => {
    if (API_LOGS) {
      const start = error.config?.metadata?.startTime;
      const duration =
        typeof start === "number"
          ? Math.round(performance.now() - start)
          : undefined;
      const method = error.config?.method?.toUpperCase() || "GET";
      const url = error.config?.url || "";
      console.log(
        `[API Error] ${method} ${url}${
          duration !== undefined ? ` - ${duration}ms` : ""
        }`
      );
      console.log(`[API Error] Error code:`, error.code);
      console.log(`[API Error] Error message:`, error.message);
      
      // Log helpful message for connection errors
      if (error.code === 'ERR_NETWORK' || error.message?.includes('CONNECTION_REFUSED')) {
        console.error(
          `[API Error] Backend server is not running. Please start it with: cd CMP-backend && npm run dev`
        );
      }
    }
    return Promise.reject(error);
  }
);

export default api;
