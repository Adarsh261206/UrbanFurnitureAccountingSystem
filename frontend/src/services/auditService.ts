import { http } from "@/lib/api/client";
import type { AuditLogList, AuditLogEntry } from "@/types/api";

export interface AuditLogParams {
  page?: number;
  limit?: number;
  entity?: string;
  action?: string;
  user_id?: string;
  from_date?: string;
  to_date?: string;
}

export const auditService = {
  list: (params: AuditLogParams = {}) => http.get<AuditLogList>("/audit-logs", { params }),
  get: (id: number) => http.get<AuditLogEntry>(`/audit-logs/${id}`),
};
