import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { FormEvent } from "react";
import { apiClient } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import type { Product } from "../types/product";
import { formatCurrency, formatDateTime } from "../utils/formatters";

interface CreateProductPayload {
  name: string;
  sku: string;
  description: string;
  price: number;
  stockQuantity: number;
}

interface UpdateProductPayload {
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
}

export function ProductsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canCreateProduct = user?.role === "OWNER" || user?.role === "ADMIN";
  const canDeleteProduct = user?.role === "OWNER" || user?.role === "ADMIN";
  const canEditProduct = user?.role === "OWNER" || user?.role === "ADMIN";
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [createError, setCreateError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [editError, setEditError] = useState("");
  const [form, setForm] = useState<CreateProductPayload>({
    name: "",
    sku: "",
    description: "",
    price: 0,
    stockQuantity: 0,
  });
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<UpdateProductPayload>({
    name: "",
    description: "",
    price: 0,
    stockQuantity: 0,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await apiClient.get<Product[]>("/api/products");
      return response.data;
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (payload: CreateProductPayload) => {
      const response = await apiClient.post<Product>("/api/products", payload);
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      setIsCreateOpen(false);
      setCreateError("");
      setForm({
        name: "",
        sku: "",
        description: "",
        price: 0,
        stockQuantity: 0,
      });
    },
    onError: () => {
      setCreateError("Failed to create product. Please check input values.");
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      await apiClient.delete(`/api/products/${productId}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      setDeleteError("");
    },
    onError: () => {
      setDeleteError("Failed to delete product.");
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({
      productId,
      payload,
    }: {
      productId: string;
      payload: UpdateProductPayload;
    }) => {
      const response = await apiClient.put<Product>(
        `/api/products/${productId}`,
        payload
      );
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      setIsEditOpen(false);
      setEditProductId(null);
      setEditError("");
    },
    onError: () => {
      setEditError("Failed to update product. Please check input values.");
    },
  });

  function handleCreateSubmit(event: FormEvent) {
    event.preventDefault();
    setCreateError("");
    createProductMutation.mutate({
      ...form,
      sku: form.sku.toUpperCase(),
    });
  }

  function handleDelete(product: Product) {
    const confirmed = window.confirm(
      `Delete product "${product.name}" (${product.sku})?`
    );
    if (!confirmed) {
      return;
    }
    setDeleteError("");
    deleteProductMutation.mutate(product.id);
  }

  function openEditModal(product: Product) {
    setEditProductId(product.id);
    setEditForm({
      name: product.name,
      description: product.description || "",
      price: product.price,
      stockQuantity: product.stockQuantity,
    });
    setEditError("");
    setIsEditOpen(true);
  }

  function handleEditSubmit(event: FormEvent) {
    event.preventDefault();
    if (!editProductId) {
      return;
    }
    setEditError("");
    updateProductMutation.mutate({
      productId: editProductId,
      payload: editForm,
    });
  }

  if (isLoading) {
    return <p className="text-slate-500">Loading products...</p>;
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
        Failed to load products.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Products</h1>
          <p className="mt-2 text-slate-500">
            Manage product catalog and stock.
          </p>
        </div>
        {canCreateProduct && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Create Product
          </button>
        )}
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {deleteError && (
          <div className="border-b border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {deleteError}
          </div>
        )}
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                SKU
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Stock
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Created
              </th>
              {(canDeleteProduct || canEditProduct) && (
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((product) => (
              <tr key={product.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{product.name}</p>
                  <p className="text-xs text-slate-500">
                    {product.description || "No description"}
                  </p>
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">{product.sku}</td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {formatCurrency(product.price)}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  <div className="flex items-center gap-2">
                    <span>{product.stockQuantity}</span>
                    {product.stockQuantity <= 10 && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                        Low
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {product.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">
                  {formatDateTime(product.createdAt)}
                </td>
                {(canDeleteProduct || canEditProduct) && (
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {canEditProduct && (
                        <button
                          onClick={() => openEditModal(product)}
                          className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                        >
                          Edit
                        </button>
                      )}
                      {canDeleteProduct && (
                        <button
                          onClick={() => handleDelete(product)}
                          disabled={deleteProductMutation.isPending}
                          className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-slate-950">Create Product</h2>
              <p className="mt-1 text-sm text-slate-500">
                Add a new product to your tenant catalog.
              </p>
            </div>

            {createError && (
              <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Name</label>
                <input
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">SKU</label>
                <input
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 uppercase outline-none focus:border-blue-500"
                  value={form.sku}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, sku: event.target.value }))
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                  rows={3}
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700">Price</label>
                  <input
                    required
                    min={0.01}
                    step="0.01"
                    type="number"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                    value={form.price}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        price: Number(event.target.value),
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Stock Quantity
                  </label>
                  <input
                    required
                    min={0}
                    type="number"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                    value={form.stockQuantity}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        stockQuantity: Number(event.target.value),
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createProductMutation.isPending}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {createProductMutation.isPending ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-slate-950">Edit Product</h2>
              <p className="mt-1 text-sm text-slate-500">
                Update product details. SKU remains unchanged.
              </p>
            </div>

            {editError && (
              <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {editError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Name</label>
                <input
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                  value={editForm.name}
                  onChange={(event) =>
                    setEditForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                  rows={3}
                  value={editForm.description}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700">Price</label>
                  <input
                    required
                    min={0.01}
                    step="0.01"
                    type="number"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                    value={editForm.price}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        price: Number(event.target.value),
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Stock Quantity
                  </label>
                  <input
                    required
                    min={0}
                    type="number"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                    value={editForm.stockQuantity}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        stockQuantity: Number(event.target.value),
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateProductMutation.isPending}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {updateProductMutation.isPending ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
