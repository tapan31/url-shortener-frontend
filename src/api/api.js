import axios from "axios";

// export default axios.create({
//   baseURL: import.meta.env.VITE_BACKEND_URL,
// });

// Base API Instance
const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // Allows Cookies to be sent and received
  withCredentials: true,
});

// Request Interceptor
// Attaches Access Token to every outgoing request
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("ACCESS_TOKEN");

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor
// Handles 401/403 by silently refreshing the token
let isRefreshing = false;
let failedQueue = [];

// Helper to resolve/reject all queued requests
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    return response;
  },

  async (error) => {
    console.log("Inside Response Interceptor");

    const originalRequest = error.config;

    // Do not attempt to refresh tokens on auth endpoints
    const isAuthEndpoint =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/register") ||
      originalRequest.url?.includes("/auth/logout") ||
      originalRequest.url?.includes("/auth/refresh");

    // If error is not 401, or we already tried refreshing this request, reject immediately
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      isAuthEndpoint
    ) {
      console.log("error.response?.status: ", error.response?.status);
      return Promise.reject(error);
    }

    // Mark this request so we don't retry infinitely
    originalRequest._retry = true;

    // If another request is already refreshing, queue this one
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((error) => Promise.reject(error));
    }

    isRefreshing = true;

    try {
      // Get the refersh token from the localStorage
      const refreshToken = localStorage.getItem("REFRESH_TOKEN");

      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      console.log("Refresh Token: ", refreshToken);

      // Call refresh endpoint
      // NOTE: When you switch to HttpOnly cookies, remove the body here.
      // The browser will send the cookie automatically.
      const { data } = await axios.post(
        `${api.defaults.baseURL}/api/auth/refresh`,
        { refreshToken },
        { withCredentials: true },
      );

      const newAccessToken = data.accessToken;
      const newRefreshToken = data.refreshToken;

      console.log("New Access Token: ", newAccessToken);
      console.log("New Refresh Token: ", newRefreshToken);

      // Set the new Access and Refresh Token
      localStorage.setItem("ACCESS_TOKEN", newAccessToken);
      localStorage.setItem("REFRESH_TOKEN", newRefreshToken);

      // Update the header for the originalRequest and retry it
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      // Resolve all the queued requests with the new token
      processQueue(null, newAccessToken);

      return api(originalRequest);
    } catch (err) {
      // Refresh failed (expired, invalid refresh token), -> force logout
      processQueue(err, null);

      localStorage.removeItem("ACCESS_TOKEN");
      localStorage.removeItem("REFRESH_TOKEN");

      window.location.href = "/login";
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
