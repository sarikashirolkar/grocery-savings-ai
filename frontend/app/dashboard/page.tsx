"use client";

import dynamic from "next/dynamic";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { AppShell } from "@/components/app-shell";
import { AuthGate } from "@/components/auth-gate";
import { ManualReceiptForm } from "@/components/manual-receipt-form";
import { MetricCard } from "@/components/metric-card";
import { PriceImportForm } from "@/components/price-import-form";
import {
  analyzePatterns,
  downloadSavingsReportCsv,
  generatePrediction,
  generateRecommendation,
  getCategorySpend,
  getMonthlySavings,
  getPantry,
  getReceipts,
  getRecommendation,
  getSavingsReport,
  getStoreComparison,
  getSummary,
  syncPantry,
  getTopSavings
} from "@/lib/api";

const DashboardCharts = dynamic(
  () => import("@/components/dashboard-charts").then((module) => module.DashboardCharts),
  {
    ssr: false,
    loading: () => (
      <section className="mt-8 panel p-5">
        <p className="eyebrow">Charts</p>
        <p className="mt-3 text-sm text-steel">Loading analytics views...</p>
      </section>
    )
  }
);

function formatMoney(amount: number | undefined, symbol = "₹") {
  return `${symbol}${(amount || 0).toFixed(0)}`;
}

function LoadingPanel({ title, copy }: { title: string; copy: string }) {
  return (
    <section className="panel mt-8 p-5">
      <h2 className="eyebrow">{title}</h2>
      <p className="mt-3 text-sm text-steel">{copy}</p>
    </section>
  );
}

function DashboardScreen() {
  const queryClient = useQueryClient();

  const summary = useQuery({ queryKey: ["summary"], queryFn: () => getSummary() });
  const monthlySavings = useQuery({ queryKey: ["monthly-savings"], queryFn: () => getMonthlySavings() });
  const categorySpend = useQuery({ queryKey: ["category-spend"], queryFn: () => getCategorySpend() });
  const storeComparison = useQuery({ queryKey: ["store-comparison"], queryFn: () => getStoreComparison() });
  const receipts = useQuery({ queryKey: ["receipts"], queryFn: () => getReceipts() });
  const pantry = useQuery({ queryKey: ["pantry"], queryFn: () => getPantry() });
  const recommendation = useQuery({ queryKey: ["recommendation"], queryFn: () => getRecommendation(), retry: false });
  const topSavings = useQuery({ queryKey: ["top-savings"], queryFn: () => getTopSavings() });
  const report = useQuery({ queryKey: ["savings-report"], queryFn: () => getSavingsReport() });

  const refreshCore = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["summary"] }),
      queryClient.invalidateQueries({ queryKey: ["receipts"] }),
      queryClient.invalidateQueries({ queryKey: ["pantry"] }),
      queryClient.invalidateQueries({ queryKey: ["monthly-savings"] }),
      queryClient.invalidateQueries({ queryKey: ["category-spend"] }),
      queryClient.invalidateQueries({ queryKey: ["store-comparison"] }),
      queryClient.invalidateQueries({ queryKey: ["top-savings"] }),
      queryClient.invalidateQueries({ queryKey: ["recommendation"] }),
      queryClient.invalidateQueries({ queryKey: ["savings-report"] })
    ]);
  };

  const patternsMutation = useMutation({ mutationFn: () => analyzePatterns(), onSuccess: refreshCore });
  const predictionMutation = useMutation({
    mutationFn: async () => {
      await syncPantry();
      return generatePrediction();
    },
    onSuccess: refreshCore
  });
  const recommendationMutation = useMutation({ mutationFn: () => generateRecommendation(), onSuccess: refreshCore });
  const summaryData = summary.data;

  const primaryActions = [
    recommendation.data
      ? `Run ${recommendation.data.recommendation_strategy.toLowerCase()} this cycle.`
      : "Generate a recommendation after patterns and prediction are refreshed.",
    topSavings.data?.[0]
      ? `Move ${topSavings.data[0].item_name} to ${topSavings.data[0].best_store || topSavings.data[0].cheapest_store} to save about ₹${topSavings.data[0].estimated_saving.toFixed(0)}.`
      : "No high-confidence saving opportunity surfaced yet.",
    summaryData?.budget_status?.warning || "The current basket is inside the planned monthly spend envelope."
  ];

  if (summary.isLoading) {
    return (
      <AppShell>
        <LoadingPanel title="Analytics" copy="Loading summary, receipt history, and optimization signals..." />
      </AppShell>
    );
  }

  if (summary.isError) {
    return (
      <AppShell>
        <section className="panel mt-8 p-5">
          <h2 className="eyebrow">Analytics</h2>
          <p className="mt-3 text-sm text-roseDeep">The dashboard could not be loaded right now. Refresh the page after signing in again.</p>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="page-head">
        <div>
          <p className="eyebrow text-rose">Analytics</p>
          <h2 className="page-title mt-2">Savings dashboard</h2>
          <p className="page-copy">Keep the optimizer moving, review the next actions, and drill into deeper spend patterns only when needed.</p>
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

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="panel p-5">
          <h2 className="eyebrow">Action queue</h2>
          <div className="mt-4 grid gap-3">
            {primaryActions.map((action) => (
              <div className="soft-card p-4 text-sm text-taupe" key={action}>
                {action}
              </div>
            ))}
          </div>
        </div>
        <div className="panel p-5">
          <h2 className="eyebrow">Current recommendation</h2>
          {recommendation.data ? (
            <div className="mt-4 space-y-3 text-sm text-taupe">
              <div className="soft-card p-4">
                <p className="font-semibold">{recommendation.data.recommendation_strategy}</p>
                <p className="mt-2 text-steel">{recommendation.data.convenience_note || "No convenience note available."}</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="soft-card p-4">
                  <p className="eyebrow">Best single store</p>
                  <p className="mt-2 font-serif text-2xl text-taupe">{recommendation.data.best_single_store}</p>
                </div>
                <div className="soft-card p-4">
                  <p className="eyebrow">Estimated saving</p>
                  <p className="mt-2 font-serif text-2xl text-taupe">{formatMoney(recommendation.data.total_estimated_saving, summaryData?.currency_symbol)}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-steel">Generate a recommendation once the next basket has been refreshed.</p>
          )}
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="panel p-5">
          <h2 className="eyebrow">Historical Insights</h2>
          <div className="mt-4 space-y-3">
            {(summaryData?.insights || []).map((insight) => (
              <div className="soft-card p-4" key={`${insight.kind}-${insight.title}`}>
                <div className="font-semibold text-taupe">{insight.title}</div>
                <div className="mt-1 text-sm text-steel">{insight.message}</div>
              </div>
            ))}
            {!summaryData?.insights?.length ? <p className="text-sm text-steel">Insights will appear as more receipt history and price data accumulate.</p> : null}
          </div>
        </div>
        <div className="panel p-5">
          <h2 className="eyebrow">Pantry Depletion</h2>
          <div className="mt-4 space-y-3">
            {(pantry.data || []).slice(0, 6).map((item) => (
              <div className="soft-card p-4" key={item.id}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-taupe">{item.item_name}</div>
                    <div className="mt-1 text-sm text-steel">
                      On hand {item.on_hand_quantity.toFixed(1)} | {item.days_remaining.toFixed(0)} days remaining
                    </div>
                  </div>
                  <div className="text-right text-sm text-taupe">{item.buy_timing.replace("_", " ")}</div>
                </div>
              </div>
            ))}
            {!pantry.data?.length ? <p className="text-sm text-steel">Sync the pantry after pattern analysis to estimate depletion timing.</p> : null}
          </div>
        </div>
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

      <DashboardCharts
        categorySpend={categorySpend.data || []}
        monthlySavings={monthlySavings.data || []}
        storeComparison={storeComparison.data || []}
      />

      <section className="mt-8 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="panel p-5">
          <div className="flex items-center justify-between">
            <h2 className="eyebrow">Top saving opportunities</h2>
            <button className="btn-quiet" onClick={() => void downloadSavingsReportCsv()} type="button">Export Savings CSV</button>
          </div>
          <div className="mt-4 space-y-3">
            {(topSavings.data || []).map((item) => (
              <div className="soft-card p-3" key={item.normalized_item_name}>
                <div className="font-serif text-2xl font-medium text-taupe">{item.item_name}</div>
                <div className="text-sm text-steel">
                  Best store {item.best_store || item.cheapest_store} | Saving {formatMoney(item.estimated_saving, summaryData?.currency_symbol)}
                </div>
              </div>
            ))}
            {!topSavings.data?.length ? <p className="text-sm text-steel">No item-level opportunities yet.</p> : null}
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
            {!report.data?.leaderboard?.length ? <p className="text-sm text-steel">Leaderboard data will appear after savings reports are generated.</p> : null}
          </div>
        </div>
        <div className="panel p-5">
          <h2 className="eyebrow">Region</h2>
          <p className="mt-3 font-serif text-3xl text-taupe">{summaryData?.region || "india"}</p>
          <p className="mt-2 text-sm text-steel">Currency is currently {summaryData?.currency_code || "INR"} and pricing/reporting surfaces follow the active demo region.</p>
        </div>
      </section>

      <section className="panel mt-8 p-5">
        <div className="flex items-center justify-between">
          <h2 className="eyebrow">Price alerts</h2>
          <p className="text-sm text-steel">{summaryData?.notifications?.length || 0} active notifications</p>
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
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <ManualReceiptForm onCreated={refreshCore} />
        <PriceImportForm onImported={refreshCore} />
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
                <td className="font-serif text-xl text-taupe">{formatMoney(receipt.total_amount, summaryData?.currency_symbol)}</td>
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
