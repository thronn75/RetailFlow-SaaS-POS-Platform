import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { apiClient } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import type { Product } from "../types/product";
import type { PaymentMethod, SaleResponse } from "../types/sale";
import { formatCurrency, formatDateTime } from "../utils/formatters";

interface CartItem {
  productId: string;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
}

export function SalesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canViewSalesHistory =
    user?.role === "OWNER" || user?.role === "ADMIN" || user?.role === "MANAGER";

  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutError, setCheckoutError] = useState("");

  const { data: products, isLoading: productsLoading, isError: productsError } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await apiClient.get<Product[]>("/api/products");
      return response.data;
    },
  });

  const { data: salesHistory, isLoading: salesLoading, isError: salesError } = useQuery({
    queryKey: ["sales"],
    enabled: canViewSalesHistory,
    queryFn: async () => {
      const response = await apiClient.get<SaleResponse[]>("/api/sales");
      return response.data;
    },
  });

  const selectedProduct = useMemo(
    () => products?.find((product) => product.id === selectedProductId),
    [products, selectedProductId]
  );

  const cartTotal = useMemo(
    () =>
      cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [cart]
  );

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<SaleResponse>("/api/sales/checkout", {
        paymentMethod,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });
      return response.data;
    },
    onSuccess: async () => {
      setCheckoutError("");
      setCart([]);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["products"] }),
        queryClient.invalidateQueries({ queryKey: ["report-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["sales"] }),
      ]);
    },
    onError: () => {
      setCheckoutError("Checkout failed. Please verify stock and try again.");
    },
  });

  function handleAddToCart() {
    if (!selectedProductId || !selectedProduct) {
      return;
    }
    if (quantity < 1) {
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === selectedProductId);
      if (existing) {
        return prev.map((item) =>
          item.productId === selectedProductId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          sku: selectedProduct.sku,
          unitPrice: selectedProduct.price,
          quantity,
        },
      ];
    });

    setQuantity(1);
  }

  function handleRemoveFromCart(productId: string) {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  }

  async function handleCheckout() {
    setCheckoutError("");
    if (cart.length === 0) {
      setCheckoutError("Add at least one item to cart.");
      return;
    }
    await checkoutMutation.mutateAsync();
  }

  if (productsLoading) {
    return <p className="text-slate-500">Loading sales module...</p>;
  }

  if (productsError || !products) {
    return (
      <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
        Failed to load products for checkout.
      </div>
    );
  }

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Sales</h1>
        <p className="mt-2 text-slate-500">Checkout and sales history.</p>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,520px)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Checkout</h2>
          <p className="mt-1 text-sm text-slate-500">
            Create a sale by adding products to cart and selecting payment method.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_120px_auto]">
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
              value={selectedProductId}
              onChange={(event) => setSelectedProductId(event.target.value)}
            >
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.sku}) - stock {product.stockQuantity}
                </option>
              ))}
            </select>
            <input
              min={1}
              type="number"
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
              className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
            />
            <button
              onClick={handleAddToCart}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Add to cart
            </button>
          </div>

          <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Unit
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Total
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cart.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-4 text-center text-sm text-slate-500"
                    >
                      Cart is empty.
                    </td>
                  </tr>
                ) : (
                  cart.map((item) => (
                    <tr key={item.productId}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{item.productName}</p>
                        <p className="text-xs text-slate-500">{item.sku}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                        {formatCurrency(item.unitPrice * item.quantity)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleRemoveFromCart(item.productId)}
                          className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between gap-4">
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
            >
              <option value="CASH">CASH</option>
              <option value="CARD">CARD</option>
              <option value="ONLINE">ONLINE</option>
            </select>
            <p className="text-lg font-bold text-slate-950">
              Total: {formatCurrency(cartTotal)}
            </p>
          </div>

          {checkoutError && (
            <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {checkoutError}
            </div>
          )}

          <button
            onClick={handleCheckout}
            disabled={checkoutMutation.isPending}
            className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {checkoutMutation.isPending ? "Processing..." : "Checkout"}
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Sales History</h2>
          {canViewSalesHistory ? (
            <>
              <p className="mt-1 text-sm text-slate-500">
                Latest tenant sales and checkout transactions.
              </p>
              {salesLoading ? (
                <p className="mt-4 text-sm text-slate-500">Loading sales history...</p>
              ) : salesError || !salesHistory ? (
                <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
                  Failed to load sales history.
                </div>
              ) : salesHistory.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">No sales yet.</p>
              ) : (
                <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Sale #
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Payment
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Total
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Created
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {salesHistory.map((sale) => (
                        <tr key={sale.id}>
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">
                            {sale.saleNumber}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700">
                            {sale.paymentMethod}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                            {formatCurrency(sale.totalAmount)}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-500">
                            {formatDateTime(sale.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <div className="mt-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Your role can perform checkout but cannot view sales history.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
