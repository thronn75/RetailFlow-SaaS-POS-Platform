import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Boxes, Receipt, Wallet } from "lucide-react";
import { apiClient } from "../api/client";
import type { ReportSummary } from "../types/report";
import { formatCurrency } from "../utils/formatters";

const cards = [
  {
    key: "totalRevenue",
    label: "Total Revenue",
    icon: Wallet,
    format: (value: number) => formatCurrency(value),
  },
  {
    key: "totalSales",
    label: "Total Sales",
    icon: Receipt,
    format: (value: number) => value.toString(),
  },
  {
    key: "activeProducts",
    label: "Active Products",
    icon: Boxes,
    format: (value: number) => value.toString(),
  },
  {
    key: "lowStockProducts",
    label: "Low Stock",
    icon: AlertTriangle,
    format: (value: number) => value.toString(),
  },
] as const;

export function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["report-summary"],
    queryFn: async () => {
      const response = await apiClient.get<ReportSummary>("/api/reports/summary");
      return response.data;
    },
  });

  if (isLoading) {
    return <p className="text-slate-500">Loading dashboard...</p>;
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
        Failed to load dashboard summary.
      </div>
    );
  }

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Dashboard</h1>
        <p className="mt-2 text-slate-500">
          Real-time overview of sales, revenue and inventory health.
        </p>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          const value = data[card.key];
          return (
            <div
              key={card.key}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
                  <Icon size={18} />
                </div>
              </div>
              <p className="mt-4 text-3xl font-bold text-slate-950">
                {card.format(value)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
