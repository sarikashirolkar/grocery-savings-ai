"use client";

import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/app-shell";
import { AuthGate } from "@/components/auth-gate";
import { getRecommendation } from "@/lib/api";


function RecommendationsScreen() {
  const recommendation = useQuery({ queryKey: ["recommendations-page"], queryFn: () => getRecommendation(), retry: false });

  return (
    <AppShell>
      <section className="page-head">
        <div>
          <p className="eyebrow text-rose">Strategy</p>
          <h2 className="page-title mt-2">Recommendations</h2>
          <p className="page-copy">View the current recommendation strategy after price, convenience, travel, and stockout weighting.</p>
        </div>
      </section>
      <section className="panel mt-8 p-5">
        {recommendation.data ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="soft-card p-4">
              <p className="eyebrow">Strategy</p>
              <p className="mt-2 font-serif text-3xl font-medium text-taupe">{recommendation.data.recommendation_strategy}</p>
            </div>
            <div className="soft-card p-4">
              <p className="eyebrow">Convenience note</p>
              <p className="mt-2 text-sm leading-6 text-taupe">{recommendation.data.convenience_note}</p>
            </div>
            <div className="soft-card p-4 text-sm text-taupe">
              <p><span className="font-semibold">Best Single Store:</span> {recommendation.data.best_single_store}</p>
              <p className="mt-2"><span className="font-semibold">Single Store Cost:</span> ₹{recommendation.data.best_single_store_cost.toFixed(0)}</p>
              <p className="mt-2"><span className="font-semibold">Best Multi-Store Cost:</span> ₹{recommendation.data.best_multi_store_cost.toFixed(0)}</p>
            </div>
            <div className="soft-card p-4 text-sm text-taupe">
              <p><span className="font-semibold">Optimized Spend:</span> ₹{recommendation.data.optimized_spend.toFixed(0)}</p>
              <p className="mt-2"><span className="font-semibold">Estimated Saving:</span> ₹{recommendation.data.total_estimated_saving.toFixed(0)}</p>
              <p className="mt-2"><span className="font-semibold">Savings Rate:</span> {recommendation.data.savings_percentage.toFixed(1)}%</p>
            </div>
            {recommendation.data.explanation ? (
              <div className="soft-card p-4 text-sm text-taupe md:col-span-2">
                <p className="font-semibold">Why this recommendation won</p>
                <p className="mt-2">{recommendation.data.explanation.summary}</p>
                <div className="mt-3 grid gap-3 md:grid-cols-4">
                  <div>Price impact: ₹{recommendation.data.explanation.price_impact.toFixed(0)}</div>
                  <div>Fees: ₹{recommendation.data.explanation.fee_impact.toFixed(0)}</div>
                  <div>Convenience credit: {recommendation.data.explanation.convenience_impact.toFixed(1)}</div>
                  <div>Stock risk: {recommendation.data.explanation.stock_risk_impact.toFixed(0)}</div>
                </div>
              </div>
            ) : null}
            {recommendation.data.item_reasons.length ? (
              <div className="soft-card p-4 text-sm text-taupe md:col-span-2">
                <p className="font-semibold">Top item-level reasons</p>
                <div className="mt-3 space-y-3">
                  {recommendation.data.item_reasons.map((reason) => (
                    <div key={`${reason.item_name}-${reason.recommended_store}`}>
                      <div className="font-medium text-taupe">{reason.item_name} {"->"} {reason.recommended_store}</div>
                      <div className="text-steel">{reason.reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-steel">Generate a recommendation from the dashboard first.</p>
        )}
      </section>
    </AppShell>
  );
}


export default function RecommendationsPage() {
  return (
    <AuthGate>
      <RecommendationsScreen />
    </AuthGate>
  );
}
