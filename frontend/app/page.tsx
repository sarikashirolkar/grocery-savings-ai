"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";

import { AuthGate } from "@/components/auth-gate";
import { ChartCard } from "@/components/chart-card";
import { ManualReceiptForm } from "@/components/manual-receipt-form";
import { MetricCard } from "@/components/metric-card";
import {
  analyzePatterns,
  comparePrices,
  generatePrediction,
  generateRecommendation,
  getCategorySpend,
  getMonthlySavings,
  getPrediction,
  getReceipts,
  getRecommendation,
  getStoreComparison,
  getSummary,
  getTopSavings,
} from "@/lib/api";


const pieColors = ["#14213d", "#fca311", "#b7e4c7", "#ff6b6b", "#7c93c3"];


function DashboardApp() {
  const [token, setToken] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    setToken(window.localStorage.getItem("grocery-token") || "");
  }, []);

  const summary = useQuery({ queryKey: ["summary", token], queryFn: () => getSummary(token), enabled: !!token });
  const monthlySavings = useQuery({ queryKey: ["monthly-savings", token], queryFn: () => getMonthlySavings(token), enabled: !!token });
  const categorySpend = useQuery({ queryKey: ["category-spend", token], queryFn: () => getCategorySpend(token), enabled: !!token });
  const storeComparison = useQuery({ queryKey: ["store-comparison", token], queryFn: () => getStoreComparison(token), enabled: !!token });
  const receipts = useQuery({ queryKey: ["receipts", token], queryFn: () => getReceipts(token), enabled: !!token });
  const prediction = useQuery({ queryKey: ["prediction", token], queryFn: () => getPrediction(token), enabled: !!token, retry: false });
  const recommendation = useQuery({ queryKey: ["recommendation", token], queryFn: () => getRecommendation(token), enabled: !!token, retry: false });
  const topSavings = useQuery({ queryKey: ["top-savings", token], queryFn: () => getTopSavings(token), enabled: !!token });
  const priceComparison = useQuery({ queryKey: ["price-comparison", token], queryFn: () => comparePrices(token), enabled: !!token, retry: false });

  const refreshCore = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["summary", token] }),
      queryClient.invalidateQueries({ queryKey: ["receipts", token] }),
      queryClient.invalidateQueries({ queryKey: ["monthly-savings", token] }),
      queryClient.invalidateQueries({ queryKey: ["category-spend", token] }),
      queryClient.invalidateQueries({ queryKey: ["store-comparison", token] }),
      queryClient.invalidateQueries({ queryKey: ["top-savings", token] }),
      queryClient.invalidateQueries({ queryKey: ["prediction", token] }),
      queryClient.invalidateQueries({ queryKey: ["recommendation", token] }),
      queryClient.invalidateQueries({ queryKey: ["price-comparison", token] })
    ]);
  };

  const patternsMutation = useMutation({
    mutationFn: () => analyzePatterns(token),
    onSuccess: refreshCore
  });

  const predictionMutation = useMutation({
    mutationFn: () => generatePrediction(token),
    onSuccess: refreshCore
  });

  const recommendationMutation = useMutation({
    mutationFn: () => generateRecommendation(token),
    onSuccess: refreshCore
  });

  const summaryData = summary.data;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      <section className="panel overflow-hidden">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-ink/50">Grocery Savings AI</p>
            <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight">
              Turn family grocery bills into next-basket predictions and store-by-store savings.
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-600">
              This MVP is seeded with demo data and supports manual receipt testing, purchase pattern analysis, basket prediction, price comparison, and recommendation generation.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link className="btn-primary text-center" href="/buy">
                Open Buying Page
              </Link>
              <Link
                className="btn-secondary text-center"
                href={prediction.data?.items?.[0] ? `/buy?item=${encodeURIComponent(prediction.data.items[0].normalized_item_name)}` : "/buy"}
              >
                Search Recommended Items
              </Link>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="btn-secondary" onClick={() => patternsMutation.mutate()} type="button">
              Analyze Patterns
            </button>
            <button className="btn-secondary" onClick={() => predictionMutation.mutate()} type="button">
              Generate Prediction
            </button>
            <button className="btn-primary" onClick={() => recommendationMutation.mutate()} type="button">
              Generate Recommendation
            </button>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="Bills Uploaded" value={`${summaryData?.bills_uploaded ?? 0}`} />
        <MetricCard label="Monthly Spend" value={`₹${summaryData?.monthly_grocery_spend?.toFixed(0) ?? "0"}`} />
        <MetricCard label="Optimized Spend" value={`₹${summaryData?.optimized_grocery_spend?.toFixed(0) ?? "0"}`} />
        <MetricCard label="Monthly Savings" value={`₹${summaryData?.monthly_savings?.toFixed(0) ?? "0"}`} tone="highlight" />
        <MetricCard label="Lifetime Savings" value={`₹${summaryData?.lifetime_savings?.toFixed(0) ?? "0"}`} />
        <MetricCard label="Savings %" value={`${summaryData?.savings_percentage?.toFixed(1) ?? "0"}%`} />
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <ChartCard title="Actual vs Optimized Spend">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlySavings.data || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="actual_spend" fill="#14213d" radius={[10, 10, 0, 0]} />
              <Bar dataKey="optimized_spend" fill="#fca311" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Category Spend">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={categorySpend.data || []} dataKey="value" nameKey="name" outerRadius={100}>
                {(categorySpend.data || []).map((entry, index) => (
                  <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <ChartCard title="Store-wise Spend">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={storeComparison.data || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={120} />
              <Tooltip />
              <Bar dataKey="value" fill="#b7e4c7" radius={[0, 10, 10, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <div className="panel">
          <h2 className="text-lg font-semibold">Current Recommendation</h2>
          {recommendation.data ? (
            <div className="mt-5 space-y-3 text-sm">
              <p><span className="font-semibold">Best Single Store:</span> {recommendation.data.best_single_store}</p>
              <p><span className="font-semibold">Single Store Cost:</span> ₹{recommendation.data.best_single_store_cost.toFixed(0)}</p>
              <p><span className="font-semibold">Multi-Store Cost:</span> ₹{recommendation.data.best_multi_store_cost.toFixed(0)}</p>
              <p><span className="font-semibold">Total Estimated Saving:</span> ₹{recommendation.data.total_estimated_saving.toFixed(0)}</p>
              <p><span className="font-semibold">Convenience Note:</span> {recommendation.data.convenience_note}</p>
            </div>
          ) : (
            <p className="mt-5 text-sm text-slate-500">Generate a recommendation after prediction.</p>
          )}
        </div>
      </section>

      <section className="mt-8">
        <ManualReceiptForm token={token} onCreated={refreshCore} />
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div className="panel overflow-x-auto">
          <h2 className="text-lg font-semibold">Predicted Next Basket</h2>
          <table className="mt-4 min-w-full text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="pb-3">Item</th>
                <th className="pb-3">Qty</th>
                <th className="pb-3">Expected Date</th>
                <th className="pb-3">Avg Price</th>
                <th className="pb-3">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {(prediction.data?.items || []).map((item) => (
                <tr className="border-t border-slate-100" key={item.id}>
                  <td className="py-3">{item.item_name}</td>
                  <td className="py-3">{item.predicted_quantity}</td>
                  <td className="py-3">{item.expected_purchase_date}</td>
                  <td className="py-3">₹{item.average_price_usually_paid.toFixed(0)}</td>
                  <td className="py-3">{Math.round(item.confidence_score * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel overflow-x-auto">
          <h2 className="text-lg font-semibold">Top Saving Opportunities</h2>
          <table className="mt-4 min-w-full text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="pb-3">Item</th>
                <th className="pb-3">Best Store</th>
                <th className="pb-3">Saving</th>
              </tr>
            </thead>
            <tbody>
              {(topSavings.data || []).map((item) => (
                <tr className="border-t border-slate-100" key={item.normalized_item_name}>
                  <td className="py-3">{item.item_name}</td>
                  <td className="py-3">{item.cheapest_store || "N/A"}</td>
                  <td className="py-3">₹{item.estimated_saving.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="panel overflow-x-auto">
          <h2 className="text-lg font-semibold">Receipt Review</h2>
          <table className="mt-4 min-w-full text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="pb-3">Store</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Total</th>
                <th className="pb-3">Items</th>
              </tr>
            </thead>
            <tbody>
              {(receipts.data || []).map((receipt) => (
                <tr className="border-t border-slate-100 align-top" key={receipt.id}>
                  <td className="py-3">{receipt.store_name}</td>
                  <td className="py-3">{receipt.purchase_date}</td>
                  <td className="py-3">₹{receipt.total_amount.toFixed(0)}</td>
                  <td className="py-3">
                    <div className="space-y-2">
                      {receipt.items.map((item) => (
                        <div className="rounded-2xl bg-slate-50 px-3 py-2" key={`${receipt.id}-${item.item_name}`}>
                          <div className="font-medium">{item.item_name}</div>
                          <div className="text-xs text-slate-500">
                            {item.quantity} x ₹{item.unit_price} | {item.category}
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel overflow-x-auto">
          <h2 className="text-lg font-semibold">Best Price by Item</h2>
          <table className="mt-4 min-w-full text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="pb-3">Item</th>
                <th className="pb-3">Cheapest Store</th>
                <th className="pb-3">Offer Price</th>
              </tr>
            </thead>
            <tbody>
              {(priceComparison.data || []).map((item) => (
                <tr className="border-t border-slate-100" key={item.normalized_item_name}>
                  <td className="py-3">{item.item_name}</td>
                  <td className="py-3">{item.cheapest_store || "N/A"}</td>
                  <td className="py-3">{item.offer_price ? `₹${item.offer_price.toFixed(0)}` : "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}


export default function HomePage() {
  return (
    <AuthGate>
      <DashboardApp />
    </AuthGate>
  );
}
