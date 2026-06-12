"use client";

import type { BuyPlanSummary } from "@/lib/types";


type StoreChoiceSummaryProps = {
  plan?: BuyPlanSummary;
  onChooseCheapest: () => void;
  onChooseStore: (storeName: string) => void;
  storeOptions: string[];
};


export function StoreChoiceSummary({ plan, onChooseCheapest, onChooseStore, storeOptions }: StoreChoiceSummaryProps) {
  return (
    <div className="space-y-6">
      <div className="panel p-5">
        <div className="flex items-center justify-between">
          <h2 className="eyebrow">Final buy plan</h2>
          <span className="text-sm text-steel">{plan?.selected_items_count || 0} selected</span>
        </div>
        <div className="mt-4 grid gap-px overflow-hidden rounded-md border border-line md:grid-cols-2">
          <div className="bg-card p-4">
            <div className="eyebrow">Expected</div>
            <div className="mt-2 font-serif text-4xl font-medium text-taupe">₹{plan?.shopping_list.expected_total_spend.toFixed(0) || "0"}</div>
          </div>
          <div className="bg-card p-4">
            <div className="eyebrow">Selected</div>
            <div className="mt-2 font-serif text-4xl font-medium text-rose">₹{plan?.selected_total_spend.toFixed(0) || "0"}</div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-lineSoft pt-4">
          <div>
            <div className="eyebrow">Stores used</div>
            <div className="mt-1 text-sm font-semibold text-taupe">{plan?.stores_used.join(", ") || "None yet"}</div>
          </div>
          <div className="text-right">
            <div className="eyebrow">You save</div>
            <div className="mt-1 font-serif text-2xl text-taupe">
              ₹{Math.max((plan?.shopping_list.expected_total_spend || 0) - (plan?.selected_total_spend || 0), 0).toFixed(0)}
            </div>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button className="btn-primary" onClick={onChooseCheapest} type="button">
            Choose Best For All
          </button>
          {storeOptions.map((store) => (
            <button className="btn-quiet" key={store} onClick={() => onChooseStore(store)} type="button">
              Choose {store} For All
            </button>
          ))}
        </div>
        {plan?.budget_status ? (
          <div className="mt-5 rounded-md border border-line bg-canvas p-4">
            <div className="eyebrow">Budget status</div>
            <div className="mt-2 flex items-center justify-between gap-4">
              <div className="font-serif text-2xl text-taupe">
                ₹{plan.budget_status.projected_spend.toFixed(0)}
                {plan.budget_status.monthly_budget ? ` / ₹${plan.budget_status.monthly_budget.toFixed(0)}` : ""}
              </div>
              <div className={`text-sm ${plan.budget_status.over_budget ? "text-roseDeep" : "text-steel"}`}>
                {plan.budget_status.warning || "Budget is on track."}
              </div>
            </div>
          </div>
        ) : null}
      </div>
      <div className="panel overflow-x-auto p-5">
        <h2 className="eyebrow">Chosen items</h2>
        <table className="data-table mt-4">
          <thead>
            <tr>
              <th className="pb-3">Item</th>
              <th className="pb-3">Chosen Outlet</th>
              <th className="pb-3">Price</th>
            </tr>
          </thead>
          <tbody>
            {(plan?.shopping_list.items || []).map((item) => {
              const selected = item.selected_store_items.at(-1);
              return (
                <tr key={item.id}>
                  <td className="font-medium text-taupe">{item.item_name}</td>
                  <td>{selected?.store_name || "Not chosen yet"}</td>
                  <td className="font-serif text-xl text-taupe">{selected ? `₹${selected.selected_price.toFixed(0)}` : "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
