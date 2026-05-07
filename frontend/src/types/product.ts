export type ProductStatus = "ACTIVE" | "INACTIVE" | "DELETED";

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  price: number;
  stockQuantity: number;
  status: ProductStatus;
  createdAt: string;
}
