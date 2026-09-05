import axios from "axios";
import type { ApiErrorBody } from "@/types/api";

/**
 * Normalized API error — PART H (error mapping) of FRONTEND_EXECUTION_PLAN_V2.
 */
export interface NormalizedApiError {
  status: number | null;
  code: string;
  message: string;
  field: string | null;
  details?: Record<string, unknown>;
}

const FALLBACK_BY_STATUS: Record<number, string> = {
  400: "The request could not be processed.",
  401: "Your session has expired. Please sign in again.",
  403: "You do not have permission to perform this action",
  404: "Record not found",
  409: "This record already exists.",
  429: "Too many attempts. Please try again later.",
  500: "An unexpected error occurred",
};

/** Documented error codes → UI copy (PART H). */
const MESSAGE_BY_CODE: Record<string, string> = {
  UNBALANCED_JOURNAL: "Debit and credit totals do not match",
  OVERPAYMENT_NOT_ALLOWED: "Payment amount exceeds the amount due",
  ALREADY_CONFIRMED: "This record has already been confirmed",
  ALREADY_PAID: "This record has already been paid",
  INVALID_TRANSITION: "This status change is not allowed",
  DRAFT_REQUIRED: "This action is only available on draft records",
  CONFIRMED_REQUIRED: "This action requires a confirmed record",
  INVALID_CREDENTIALS: "Invalid Login Id or Password",
  UNAUTHORIZED: "Your session has expired. Please sign in again.",
  TOKEN_EXPIRED: "Your session has expired. Please sign in again.",
  INVALID_TOKEN: "Your session has expired. Please sign in again.",
  FORBIDDEN: "You do not have permission to perform this action",
  OWNERSHIP_REQUIRED: "You do not have permission to perform this action",
  NOT_FOUND: "Record not found",
  DUPLICATE_LOGIN_ID: "This Login Id is already taken",
  DUPLICATE_EMAIL: "This email is already registered",
  ALREADY_EXISTS: "This record already exists",
  RATE_LIMITED: "Too many attempts. Please try again later.",
  WEAK_PASSWORD: "Password does not meet the complexity requirements",
  INTERNAL_ERROR: "An unexpected error occurred",
  DATABASE_ERROR: "An unexpected error occurred",
};

export function normalizeError(error: unknown): NormalizedApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? null;
    const body = error.response?.data as Partial<ApiErrorBody> | undefined;
    const apiError = body?.error;
    const code = apiError?.code ?? (status ? `HTTP_${status}` : "NETWORK_ERROR");
    const message =
      MESSAGE_BY_CODE[code] ??
      apiError?.message ??
      (status ? FALLBACK_BY_STATUS[status] : null) ??
      "Unable to reach the server. Check your connection and try again.";
    return {
      status,
      code,
      message,
      field: apiError?.field ?? null,
      ...(apiError?.details ? { details: apiError.details } : {}),
    };
  }
  return {
    status: null,
    code: "UNKNOWN_ERROR",
    message: error instanceof Error ? error.message : "An unexpected error occurred",
    field: null,
  };
}

export const isNormalizedApiError = (v: unknown): v is NormalizedApiError =>
  typeof v === "object" && v !== null && "code" in v && "message" in v;

export function errorMessage(error: unknown): string {
  return isNormalizedApiError(error) ? error.message : normalizeError(error).message;
}
