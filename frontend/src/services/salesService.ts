import { http } from "@/lib/api/client";
import type {
  InvoiceDetail,
  InvoiceList,
  InvoiceStatus,
  OrderLineInput,
  PayRequest,
  SalesOrderList,
  SalesOrderRow,
} from "@/types/api";

/** PART B6 — Sales orders (A7 field names from 08_API_CONTRACTS). */
export interface SalesOrderInput {
  customer_id: string;
  order_date: string;
  lines: OrderLineInput[];
}
export const salesOrdersService = {
  list: (
    params: { page?: number; limit?: number; status?: string; search?: string } = {},
  ) => http.get<SalesOrderList>("/sales-orders", { params }),
  create: (body: SalesOrderInput) => http.post<SalesOrderRow>("/sales-orders", body),
  /** Draft only. */
  confirm: (id: string) => http.put<SalesOrderRow>(`/sales-orders/${id}/confirm`),
};

/** PART B6 — Invoices. */
export interface InvoiceInput {
  customer_id: string;
  invoice_date: string;
  due_date: string;
  sales_order_id?: string;
  lines: OrderLineInput[];
}
export interface SendDocumentRequest {
  email_to: string;
  subject: string;
  body: string;
}

export const invoicesService = {
  list: (
    params: {
      page?: number;
      limit?: number;
      status?: InvoiceStatus | "";
      customer_id?: string;
    } = {},
  ) => http.get<InvoiceList>("/invoices", { params }),
  get: (id: string) => http.get<InvoiceDetail>(`/invoices/${id}`),
  create: (body: InvoiceInput) => http.post<InvoiceDetail>("/invoices", body),
  /** Draft only. */
  update: (id: string, body: Partial<InvoiceInput>) =>
    http.put<InvoiceDetail>(`/invoices/${id}`, body),
  /** Draft only — creates the journal entry. */
  confirm: (id: string) => http.post<InvoiceDetail>(`/invoices/${id}/confirm`),
  /** A4 — POST cancel, draft only. */
  cancel: (id: string) => http.post<InvoiceDetail>(`/invoices/${id}/cancel`),
  pay: (id: string, body: PayRequest) =>
    http.post<InvoiceDetail>(`/invoices/${id}/pay`, body),
  print: (id: string) => http.blob(`/invoices/${id}/print`),
  send: (id: string, body: SendDocumentRequest) =>
    http.post<{ message: string }>(`/invoices/${id}/send`, body),
};
