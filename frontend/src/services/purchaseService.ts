import { http } from "@/lib/api/client";
import type {
  BillDetail,
  BillList,
  InvoiceStatus,
  OrderLineInput,
  PayRequest,
  PurchaseOrderDetail,
  PurchaseOrderList,
  PurchaseOrderRow,
} from "@/types/api";
import type { SendDocumentRequest } from "./salesService";

/** PART B7 — Purchase orders (A7 field names). */
export interface PurchaseOrderInput {
  vendor_id: string;
  order_date: string;
  lines: OrderLineInput[];
}
export const purchaseOrdersService = {
  list: (params: { page?: number; limit?: number; status?: string; search?: string } = {}) =>
    http.get<PurchaseOrderList>("/purchase-orders", { params }),
  get: (id: string) => http.get<PurchaseOrderDetail>(`/purchase-orders/${id}`),
  create: (body: PurchaseOrderInput) => http.post<PurchaseOrderRow>("/purchase-orders", body),
  /** Draft only. */
  confirm: (id: string) => http.put<PurchaseOrderRow>(`/purchase-orders/${id}/confirm`),
};

/** PART B7 — Bills (admin/accountant only, A1). */
export interface BillInput {
  vendor_id: string;
  bill_date: string;
  due_date: string;
  purchase_order_id?: string;
  lines: OrderLineInput[];
}
export const billsService = {
  list: (
    params: {
      page?: number;
      limit?: number;
      status?: InvoiceStatus | "";
      vendor_id?: string;
      search?: string;
    } = {},
  ) => http.get<BillList>("/bills", { params }),
  get: (id: string) => http.get<BillDetail>(`/bills/${id}`),
  create: (body: BillInput) => http.post<BillDetail>("/bills", body),
  /** Draft only. */
  update: (id: string, body: Partial<BillInput>) => http.put<BillDetail>(`/bills/${id}`, body),
  /** Draft only — creates the journal entry. */
  confirm: (id: string) => http.post<BillDetail>(`/bills/${id}/confirm`),
  /** A4 — POST cancel, draft only. */
  cancel: (id: string) => http.post<BillDetail>(`/bills/${id}/cancel`),
  pay: (id: string, body: PayRequest) => http.post<BillDetail>(`/bills/${id}/pay`, body),
  /** A17 FLAG — backend must expose the bill print/send endpoints. */
  print: (id: string) => http.blob(`/bills/${id}/print`),
  send: (id: string, body: SendDocumentRequest) =>
    http.post<{ message: string }>(`/bills/${id}/send`, body),
};
