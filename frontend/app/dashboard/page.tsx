"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { AppShell } from "@/components/app-shell";
import { AuthGate } from "@/components/auth-gate";
import { ChartCard } from "@/components/chart-card";
import { ManualReceiptForm } from "@/components/manual-receipt-form";
import { MetricCard } from "@/components/metric-card";
import {
  analyzePatterns,
  downloadSavingsReportCsv,
  generatePrediction,
  generateRecommendation,
  getCategorySpend,
  getMonthlySavings,
  getReceipts,
  getRecommendation,
  getSavingsReport,
  getStoreComparison,
  getSummary,
  getTopSavings,
} from "@/lib/api";


const pieColors = ["#604D53", "#DB7F8E", "#9DA3A4", "#D5C5C8", "#FFDBDA"];


function formatMoney(amount: number | undefined, symbol = "₹") {
  return `${symbol}${(amount || 0).toFixed(0)}`;
}


function DashboardScreen() {
  const [token, setToken] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    setToken(window.localStorage.getItem("grocery-token") || "cookie");
  }, []);

  const summary = useQuery({ queryKey: ["summary", token], queryFn: () => getSummary(token), enabled: !!token });
  const monthlySavings = useQuery({ queryKey: ["monthly-savings", token], queryFn: () => getMonthlySavings(token), enabled: !!token });
  const categorySpend = useQuery({ queryKey: ["category-spend", token], queryFn: () => getCategorySpend(token), enabled: !!token });
  const storeComparison = useQuery({ queryKey: ["store-comparison", token], queryFn: () => getStoreComparison(token), enabled: !!token });
  const receipts = useQuery({ queryKey: ["receipts", token], queryFn: () => getReceipts(token), enabled: !!token });
  const recommendation = useQuery({ queryKey: ["recommendation", token], queryFn: () => getRecommendation(token), enabled: !!token, retry: false });
  const topSavings = useQuery({ queryKey: ["top-savings", token], queryFn: () => getTopSavings(token), enabled: !!token });
  const report = useQuery({ queryKey: ["savings-report", token], queryFn: () => getSavingsReport(token), enabled: !!token });

  const refreshCore = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["summary", token] }),
      queryClient.invalidateQueries({ queryKey: ["receipts", token] }),
      queryClient.invalidateQueries({ queryKey: ["monthly-savings", token] }),
      queryClient.invalidateQueries({ queryKey: ["category-spend", token] }),
      queryClient.invalidateQueries({ queryKey: ["store-comparison", token] }),
      queryClient.invalidateQueries({ queryKey: ["top-savings", token] }),
      queryClient.invalidateQueries({ queryKey: ["recommendation", token] }),
      queryClient.invalidateQueries({ queryKey: ["savings-report", token] })
    ]);
  };

  const patternsMutation = useMutation({ mutationFn: () => analyzePatterns(token), onSuccess: refreshCore });
  const predictionMutation = useMutation({ mutationFn: () => generatePrediction(token), onSuccess: refreshCore });
  const recommendationMutation = useMutation({ mutationFn: () => generateRecommendation(token), onSuccess: refreshCore });
  const summaryData = summary.data;

  return (
    <AppShell>
      <section className="page-head">
        <div>
          <p className="eyebrow text-rose">Analytics</p>
          <h2 className="page-title mt-2">Savings dashboard</h2>
          <p className="page-copy">Where your grocery spend goes, how the optimizer behaves across stores, and what each cycle is still leaving on the table.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="btn-quiet" onClick={() => patternsMutation.mutate()} type="button">Analyze Patterns</button>
          <button className="btn-secondary" onClick={() => predictionMutation.mutate()} type="button">Generate Prediction</button>
          <button className="btn-primary" onClick={() => recommendationMutation.mutate()} type="button">Recommendation</button>
        </div>
      </section>
      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="Bills Uploaded" value={`${summaryData?.bills_uploaded ?? 0}`} />
        <MetricCard label="Monthly Spend" value={formatMoney(summaryData?.monthly_grocery_spend, summaryData?.currency_symbol)} />
        <MetricCard label="Optimized Spend" value={formatMoney(summaryData?.optimized_grocery_spend, summaryData?.currency_symbol)} />
        <MetricCard label="Monthly Savings" value={formatMoney(summaryData?.monthly_savings, summaryData?.currency_symbol)} tone="highlight" />
        <MetricCard label="Lifetime Savings" value={formatMoney(summaryData?.lifetime_savings, summaryData?.currency_symbol)} />
        <MetricCard label="Savings %" value={`${summaryData?.savings_percentage?.toFixed(1) ?? "0"}%`} />
      </section>
      {summaryData?.budget_status ? (
        <section className="panel mt-8 p-5">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="eyebrow">Budget tracking</p>
              <h3 className="mt-2 font-serif text-3xl font-medium text-taupe">
                {summaryData.budget_status.monthly_budget
                  ? `${formatMoney(summaryData.budget_status.projected_spend, summaryData.currency_symbol)} / ${formatMoney(summaryData.budget_status.monthly_budget, summaryData.currency_symbol)}`
                  : "No monthly budget set"}
              </h3>
              <p className="mt-2 text-sm text-steel">
                {summaryData.budget_status.warning || "The predicted basket is currently being tracked against your monthly plan."}
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="soft-card p-4">
                <p className="eyebrow">Projected</p>
                <p className="mt-2 font-serif text-2xl text-taupe">{formatMoney(summaryData.budget_status.projected_spend, summaryData.currency_symbol)}</p>
              </div>
              <div className="soft-card p-4">
                <p className="eyebrow">Remaining</p>
                <p className={`mt-2 font-serif text-2xl ${summaryData.budget_status.over_budget ? "text-roseDeep" : "text-taupe"}`}>
                  {summaryData.budget_status.remaining_budget == null ? "N/A" : formatMoney(summaryData.budget_status.remaining_budget, summaryData.currency_symbol)}
                </p>
              </div>
              <div className="soft-card p-4">
                <p className="eyebrow">Utilization</p>
                <p className="mt-2 font-serif text-2xl text-taupe">
                  {summaryData.budget_status.budget_utilization_pct == null ? "N/A" : `${summaryData.budget_status.budget_utilization_pct.toFixed(0)}%`}
                </p>
              </div>
            </div>
          </div>
        </section>
      ) : null}
      <section className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <ChartCard title="Actual vs Optimized Spend">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlySavings.data || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="actual_spend" fill="#9DA3A4" radius={[4, 4, 0, 0]} />
              <Bar dataKey="optimized_spend" fill="#DB7F8E" radius={[4, 4, 0, 0]} />
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
              <Bar dataKey="value" fill="#DB7F8E" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <div className="panel p-5">
          <h2 className="eyebrow">Top saving opportunities</h2>
          <div className="mt-4 space-y-3">
            {(topSavings.data || []).map((item) => (
              <div className="soft-card p-3" key={item.normalized_item_name}>
                <div className="font-serif text-2xl font-medium text-taupe">{item.item_name}</div>
                <div className="text-sm text-steel">
                  Best store {item.best_store || item.cheapest_store} | Saving ₹{item.estimated_saving.toFixed(0)}
                </div>
              </div>
            ))}
          </div>
          {recommendation.data ? (
            <div className="mt-6 rounded-md border border-line bg-canvas p-4 text-sm text-taupe">
              Strategy: {recommendation.data.recommendation_strategy} | Best single store: {recommendation.data.best_single_store}
            </div>
          ) : null}
        </div>
      </section>
      <section className="mt-8 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="panel p-5">
          <div className="flex items-center justify-between">
            <h2 className="eyebrow">Price alerts</h2>
            <button className="btn-quiet" onClick={() => void downloadSavingsReportCsv(token)} type="button">Export Savings CSV</button>
          </div>
          <div className="mt-4 space-y-3">
            {(summaryData?.notifications || []).map((notification, index) => (
              <div className="soft-card p-3" key={`${notification.title}-${index}`}>
                <div className="font-semibold text-taupe">{notification.title}</div>
                <div className="mt-1 text-sm text-steel">{notification.message}</div>
              </div>
            ))}
            {!summaryData?.notifications?.length ? <p className="text-sm text-steel">No current price alerts.</p> : null}
          </div>
        </div>
        <div className="panel p-5">
          <h2 className="eyebrow">Prediction accuracy</h2>
          {summaryData?.prediction_accuracy ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="soft-card p-4">
                <p className="eyebrow">Month</p>
                <p className="mt-2 font-serif text-2xl text-taupe">{summaryData.prediction_accuracy.prediction_month}</p>
              </div>
              <div className="soft-card p-4">
                <p className="eyebrow">Match rate</p>
                <p className="mt-2 font-serif text-2xl text-taupe">{summaryData.prediction_accuracy.match_rate.toFixed(0)}%</p>
              </div>
              <div className="soft-card p-4">
                <p className="eyebrow">Spend accuracy</p>
                <p className="mt-2 font-serif text-2xl text-taupe">{summaryData.prediction_accuracy.spend_accuracy_pct.toFixed(0)}%</p>
              </div>
              <div className="soft-card p-4">
                <p className="eyebrow">Confidence delta</p>
                <p className="mt-2 font-serif text-2xl text-taupe">{summaryData.prediction_accuracy.confidence_delta.toFixed(0)} pts</p>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-steel">Prediction accuracy appears after a completed month with both a saved prediction and actual receipts.</p>
          )}
        </div>
      </section>
      <section className="mt-8 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="panel p-5">
          <h2 className="eyebrow">Savings leaderboard</h2>
          <div className="mt-4 space-y-3">
            {(report.data?.leaderboard || []).slice(0, 5).map((entry) => (
              <div className="flex items-center justify-between border-b border-lineSoft pb-3" key={entry.month}>
                <div className="text-sm font-semibold text-taupe">#{entry.rank} {entry.month}</div>
                <div className="font-serif text-2xl text-taupe">{formatMoney(entry.savings, summaryData?.currency_symbol)}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel p-5">
          <h2 className="eyebrow">Region</h2>
          <p className="mt-3 font-serif text-3xl text-taupe">{summaryData?.region || "india"}</p>
          <p className="mt-2 text-sm text-steel">Currency is currently {summaryData?.currency_code || "INR"} and pricing/reporting surfaces now follow the active demo region.</p>
        </div>
      </section>
      <section className="mt-8">
        <ManualReceiptForm token={token} onCreated={refreshCore} />
      </section>
      <section className="panel mt-8 overflow-x-auto p-5">
        <h2 className="eyebrow">Receipt review</h2>
        <table className="data-table mt-4">
          <thead>
            <tr>
              <th className="pb-3">Store</th>
              <th className="pb-3">Date</th>
              <th className="pb-3">Total</th>
              <th className="pb-3">Items</th>
            </tr>
          </thead>
          <tbody>
            {(receipts.data || []).map((receipt) => (
              <tr key={receipt.id}>
                <td className="font-medium text-taupe">{receipt.store_name}</td>
                <td>{receipt.purchase_date}</td>
                <td className="font-serif text-xl text-taupe">₹{receipt.total_amount.toFixed(0)}</td>
                <td>
                  {receipt.items.length}
                  {receipt.file_name ? <span className="ml-2 text-xs text-steel">• {receipt.file_name}</span> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}


export default function DashboardPage() {
  return (
    <AuthGate>
      <DashboardScreen />
    </AuthGate>
  );
}
