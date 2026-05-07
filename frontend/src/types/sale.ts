export type PaymentMethod = "CASH" | "CARD" | "ONLINE";
export type SaleStatus = "COMPLETED" | "CANCELLED";

export interface SaleItemResponse {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface SaleResponse {
  id: string;
  saleNumber: string;
  status: SaleStatus;
  paymentMethod: PaymentMethod;
  totalAmount: number;
  createdAt: string;
  items: SaleItemResponse[];
}
