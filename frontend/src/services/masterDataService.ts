import { http } from "@/lib/api/client";
import type {
  AccountType,
  Analytical,
  Brand,
  BrandList,
  Category,
  ChartOfAccount,
  Contact,
  ContactList,
  ContactType,
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
  contact_type?: ContactType;
  gstin?: string;
  pan?: string;
}
export const contactsService = {
  list: (
    params: {
      page?: number;
      limit?: number;
      search?: string;
      sort?: string;
      order?: "asc" | "desc";
      contact_type?: ContactType;
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
  brand_id?: string;
  brand_name?: string;
  sku?: string;
  barcode?: string;
  hsn_code?: string;
  description?: string;
  is_active?: boolean;
  sales_price: number;
  cost: number;
  image_url?: string;
}
export const productsService = {
  list: (
    params: {
      page?: number;
      limit?: number;
      search?: string;
      category_id?: string;
      brand_id?: string;
      is_active?: string;
    } = {},
  ) => http.get<ProductList>("/products", { params }),
  get: (id: string) => http.get<Product>(`/products/${id}`),
  create: (body: ProductInput) => http.post<Product>("/products", body),
  update: (id: string, body: Partial<ProductInput>) => http.put<Product>(`/products/${id}`, body),
  bulkDelete: (ids: string[]) => http.post<{ deleted: number }>("/products/bulk/delete", { ids }),
  bulkToggle: (ids: string[], is_active: boolean) =>
    http.post<{ updated: number }>("/products/bulk/toggle", { ids, is_active }),
  addImage: (id: string, image_url: string) =>
    http.post<{ id: string; image_url: string; sort_order: number }>(`/products/${id}/images`, {
      image_url,
    }),
  removeImage: (id: string, imageId: string) => http.delete(`/products/${id}/images/${imageId}`),
};

/** PART B3 — Brands. */
export interface BrandInput {
  name: string;
}
export const brandsService = {
  list: (params: { page?: number; limit?: number; search?: string } = {}) =>
    http.get<BrandList>("/brands", { params }),
  get: (id: string) => http.get<Brand>(`/brands/${id}`),
  create: (body: BrandInput) => http.post<Brand>("/brands", body),
  update: (id: string, body: Partial<BrandInput>) => http.put<Brand>(`/brands/${id}`, body),
  delete: (id: string) => http.delete(`/brands/${id}`),
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
