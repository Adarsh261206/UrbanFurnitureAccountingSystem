import { http } from "@/lib/api/client";
import type { CreditNoteDetail, CreditNoteList, CreditNoteStatus } from "@/types/api";

export interface CreditNoteInput {
  contact_id: string;
  type: string;
  invoice_id?: string | null;
  bill_id?: string | null;
  date: string;
  due_date?: string | null;
  subtotal: number;
  tax_rate: number;
  notes?: string | null;
  reason?: string | null;
}

export const creditNotesService = {
  list: (
    params: {
      page?: number;
      limit?: number;
      status?: CreditNoteStatus | "";
      type?: string;
      contact_id?: string;
      search?: string;
    } = {},
  ) => http.get<CreditNoteList>("/credit-notes", { params }),
  get: (id: string) => http.get<CreditNoteDetail>(`/credit-notes/${id}`),
  create: (body: CreditNoteInput) => http.post<CreditNoteDetail>("/credit-notes", body),
  update: (id: string, body: Partial<CreditNoteInput>) =>
    http.put<CreditNoteDetail>(`/credit-notes/${id}`, body),
  delete: (id: string) => http.delete<{ message: string }>(`/credit-notes/${id}`),
  confirm: (id: string) => http.post<CreditNoteDetail>(`/credit-notes/${id}/confirm`),
  cancel: (id: string) => http.post<CreditNoteDetail>(`/credit-notes/${id}/cancel`),
};
