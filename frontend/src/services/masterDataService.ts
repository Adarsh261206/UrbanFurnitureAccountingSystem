import { http } from "@/lib/api/client";
import type {
  AccountType,
  Analytical,
  Category,
  ChartOfAccount,
  Contact,
  ContactList,
  Journal,
  JournalEntryDetail,
  JournalEntryList,
  Product,
  ProductList,
  Role,
  User,
  UserList,
} from "@/types/api";

/** PART B2 — Users (admin only). */
export interface CreateUserRequest {
  name: string;
  login_id: string;
  email: string;
  role: Role;
  password: string;
  confirm_password: string;
}
export const usersService = {
  list: (params: { page?: number; limit?: number; search?: string } = {}) =>
    http.get<UserList>("/users", { params }),
  create: (body: CreateUserRequest) => http.post<User>("/users", body),
};

/** PART B3 — Contacts. */
export interface ContactInput {
  name: string;
  email: string;
  phone?: string;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  image_url?: string;
}
export const contactsService = {
  list: (
    params: {
      page?: number;
      limit?: number;
      search?: string;
      sort?: string;
      order?: "asc" | "desc";
    } = {},
  ) => http.get<ContactList>("/contacts", { params }),
  get: (id: string) => http.get<Contact>(`/contacts/${id}`),
  create: (body: ContactInput) => http.post<Contact>("/contacts", body),
  update: (id: string, body: Partial<ContactInput>) => http.put<Contact>(`/contacts/${id}`, body),
};

/** PART B3 — Products. */
export interface ProductInput {
  name: string;
  product_type: Product["product_type"];
  category_id: string;
  category_name?: string;
  sales_price: number;
  cost: number;
  image_url?: string;
}
export const productsService = {
  list: (params: { page?: number; limit?: number; search?: string; category_id?: string } = {}) =>
    http.get<ProductList>("/products", { params }),
  get: (id: string) => http.get<Product>(`/products/${id}`),
  create: (body: ProductInput) => http.post<Product>("/products", body),
  update: (id: string, body: Partial<ProductInput>) => http.put<Product>(`/products/${id}`, body),
};

/** PART B3 — Categories. */
export const categoriesService = {
  list: () => http.get<Category[]>("/categories"),
  create: (body: { name: string }) => http.post<Category>("/categories", body),
};

/** PART B3 — Analyticals. */
export interface AnalyticalInput {
  name: string;
  responsible_id: string;
  start_date: string;
  to_date: string;
  end_date: string;
  analytic_account: string;
}
export const analyticalsService = {
  list: () => http.get<Analytical[]>("/analyticals"),
  create: (body: AnalyticalInput) => http.post<Analytical>("/analyticals", body),
  update: (id: string, body: Partial<AnalyticalInput>) =>
    http.put<Analytical>(`/analyticals/${id}`, body),
};

/** PART B3 — Chart of accounts (A10 path). */
export const accountsService = {
  list: () => http.get<ChartOfAccount[]>("/chart-of-accounts"),
  create: (body: { name: string; account_type: AccountType }) =>
    http.post<ChartOfAccount>("/chart-of-accounts", body),
};

/** PART B3 — Journals. */
export const journalsService = {
  list: () => http.get<Journal[]>("/journals"),
};

/** PART B4 — Journal entries. SUM(debit) must equal SUM(credit). */
export interface JournalEntryLineInput {
  account_id: string;
  partner_id?: string;
  debit: number;
  credit: number;
}
export interface JournalEntryInput {
  journal_id: string;
  accounting_date: string;
  reference?: string;
  lines: JournalEntryLineInput[];
}
export const journalEntriesService = {
  list: (
    params: {
      page?: number;
      limit?: number;
      journal_id?: string;
      status?: string;
      date_from?: string;
      date_to?: string;
    } = {},
  ) => http.get<JournalEntryList>("/journal-entries", { params }),
  get: (id: string) => http.get<JournalEntryDetail>(`/journal-entries/${id}`),
  create: (body: JournalEntryInput) => http.post<JournalEntryDetail>("/journal-entries", body),
};
