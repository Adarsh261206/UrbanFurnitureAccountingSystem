import axios, { type AxiosRequestConfig } from "axios";
import { normalizeError } from "./errors";

/**
 * Axios instance — 24_LOVABLE_INTEGRATION_GUIDE §3.
 * Cookie (HttpOnly) auth only: no token is ever read, stored or attached here.
 */
export const API_BASE_URL: string =
  (import.meta.env["VITE_API_URL"] as string | undefined) ??
  "http://localhost:3000/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // CRITICAL: sends the auth_token cookie
  headers: { "Content-Type": "application/json" },
});

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

/** Registered once by the auth provider: 401 → clear session + redirect to /login. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  onUnauthorized = handler;
}

/** Requests where a 401 is an expected answer and must not trigger a global logout. */
const SILENT_401_PATHS = ["/auth/login", "/auth/me", "/auth/signup", "/auth/logout"];

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalized = normalizeError(error);
    const url = (error?.config?.url as string | undefined) ?? "";
    if (normalized.status === 401 && !SILENT_401_PATHS.some((p) => url.startsWith(p))) {
      onUnauthorized?.();
    }
    return Promise.reject(normalized);
  },
);

/** Typed helpers — services use these, components never call axios directly. */
export const http = {
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    (await apiClient.get<T>(url, config)).data,
  post: async <T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    (await apiClient.post<T>(url, body, config)).data,
  put: async <T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    (await apiClient.put<T>(url, body, config)).data,
  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    (await apiClient.delete<T>(url, config)).data,
  getBlob: async (url: string, config?: AxiosRequestConfig): Promise<Blob> =>
    (await apiClient.get(url, { ...config, responseType: "blob" })).data as Blob,
  blob: async (url: string, body?: unknown): Promise<Blob> =>
    (await apiClient.post(url, body, { responseType: "blob" })).data as Blob,
};
