import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { apiClient } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import type { Product } from "../types/product";
import { formatDateTime } from "../utils/formatters";

type InventoryMovementType =
  | "INITIAL_STOCK"
  | "STOCK_IN"
  | "STOCK_OUT"
  | "SALE"
  | "ADJUSTMENT";

interface InventoryMovement {
  id: string;
  productId: string;
  type: InventoryMovementType;
  quantityChange: number;
  stockAfter: number;
  note: string | null;
  createdAt: string;
}

interface StockAdjustmentPayload {
  quantityChange: number;
  note: string;
}

export function InventoryPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canAdjustStock =
    user?.role === "OWNER" || user?.role === "ADMIN" || user?.role === "MANAGER";

  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantityChange, setQuantityChange] = useState<number>(0);
  const [note, setNote] = useState("");
  const [adjustError, setAdjustError] = useState("");

  const { data: products, isLoading: productsLoading, isError: productsError } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await apiClient.get<Product[]>("/api/products");
      return response.data;
    },
  });

  useEffect(() => {
    if (!selectedProductId && products && products.length > 0) {
      setSelectedProductId(products[0].id);
    }
  }, [selectedProductId, products]);

  const selectedProduct = useMemo(
    () => products?.find((product) => product.id === selectedProductId),
    [products, selectedProductId]
  );

  const {
    data: movements,
    isLoading: movementsLoading,
    isError: movementsError,
  } = useQuery({
    queryKey: ["inventory-movements", selectedProductId],
    enabled: Boolean(selectedProductId),
    queryFn: async () => {
      const response = await apiClient.get<InventoryMovement[]>(
        `/api/products/${selectedProductId}/stock-adjustments/movements`
      );
      return response.data;
    },
  });

  const adjustStockMutation = useMutation({
    mutationFn: async (payload: StockAdjustmentPayload) => {
      const response = await apiClient.post<InventoryMovement>(
        `/api/products/${selectedProductId}/stock-adjustments`,
        payload
      );
      return response.data;
    },
    onSuccess: async () => {
      setAdjustError("");
      setQuantityChange(0);
      setNote("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["products"] }),
        queryClient.invalidateQueries({
          queryKey: ["inventory-movements", selectedProductId],
        }),
      ]);
    },
    onError: () => {
      setAdjustError("Failed to adjust stock. Please verify your input.");
    },
  });

  function handleAdjustStock(event: FormEvent) {
    event.preventDefault();
    setAdjustError("");
    adjustStockMutation.mutate({
      quantityChange,
      note,
    });
  }

  if (productsLoading) {
    return <p className="text-slate-500">Loading inventory...</p>;
  }

  if (productsError || !products) {
    return (
      <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
        Failed to load products for inventory page.
      </div>
    );
  }

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Inventory</h1>
        <p className="mt-2 text-slate-500">
          Track stock adjustments and movement history.
        </p>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Stock Adjustment</h2>
          <p className="mt-1 text-sm text-slate-500">
            Select a product and adjust stock by positive or negative quantity.
          </p>

          <form onSubmit={handleAdjustStock} className="mt-5 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Product</label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                value={selectedProductId}
                onChange={(event) => setSelectedProductId(event.target.value)}
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.sku})
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
              Current stock:{" "}
              <span className="font-semibold text-slate-950">
                {selectedProduct?.stockQuantity ?? 0}
              </span>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Quantity Change
              </label>
              <input
                required
                type="number"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                value={quantityChange}
                onChange={(event) => setQuantityChange(Number(event.target.value))}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Note</label>
              <textarea
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                rows={3}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Reason for adjustment"
              />
            </div>

            {adjustError && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {adjustError}
              </div>
            )}

            {canAdjustStock ? (
              <button
                type="submit"
                disabled={adjustStockMutation.isPending}
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {adjustStockMutation.isPending ? "Adjusting..." : "Adjust Stock"}
              </button>
            ) : (
              <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Your role can view inventory, but cannot perform stock adjustments.
              </div>
            )}
          </form>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Movement History</h2>
          <p className="mt-1 text-sm text-slate-500">
            Latest stock movements for selected product.
          </p>

          {movementsLoading ? (
            <p className="mt-4 text-sm text-slate-500">Loading movement history...</p>
          ) : movementsError || !movements ? (
            <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
              Failed to load movement history.
            </div>
          ) : movements.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No movements found.</p>
          ) : (
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Change
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Stock After
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Note
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movements.map((movement) => (
                    <tr key={movement.id}>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        {movement.type}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {movement.quantityChange > 0
                          ? `+${movement.quantityChange}`
                          : movement.quantityChange}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {movement.stockAfter}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {movement.note || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {formatDateTime(movement.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
