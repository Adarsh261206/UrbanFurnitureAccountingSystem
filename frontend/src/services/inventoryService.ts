import { http } from "@/lib/api/client";
import type {
  StockLevel,
  StockLevelList,
  StockMove,
  StockMoveList,
  StockSummary,
} from "@/types/api";

export interface StockAdjustInput {
  product_id: string;
  quantity: number;
  notes?: string;
}

export const inventoryService = {
  getStockLevels: (
    params: { page?: number; limit?: number; search?: string; brand_id?: string } = {},
  ) => http.get<StockLevelList>("/inventory", { params }),

  getStockMoves: (
    params: {
      page?: number;
      limit?: number;
      productId?: string;
      type?: string;
      from_date?: string;
      to_date?: string;
    } = {},
  ) => http.get<StockMoveList>("/inventory/moves", { params }),

  adjustStock: (data: StockAdjustInput) =>
    http.post<{ message: string }>("/inventory/adjust", {
      productId: data.product_id,
      quantity: data.quantity,
      notes: data.notes,
    }),

  getStockSummary: () => http.get<StockSummary>("/inventory/summary"),
};
