"use client";

import type { PriceComparisonItem } from "@/lib/types";


type PriceComparisonTableProps = {
  comparison?: PriceComparisonItem;
  selectedStore?: string;
  onChoose: (storeName: string) => void;
};


export function PriceComparisonTable({ comparison, selectedStore, onChoose }: PriceComparisonTableProps) {
  if (!comparison) {
    return (
      <div className="panel p-5">
        <h2 className="eyebrow">Price comparison</h2>
        <p className="mt-4 text-sm text-steel">Choose or search an item to compare prices across outlets.</p>
      </div>
    );
  }

  return (
    <div className="panel p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="eyebrow">Price comparison</p>
          <h2 className="mt-2 font-serif text-4xl font-medium tracking-[-0.02em] text-taupe">{comparison.item_name}</h2>
          <p className="mt-2 text-sm text-steel">
            Cheapest store: <span className="font-semibold">{comparison.cheapest_store || "N/A"}</span>. Best weighted recommendation:{" "}
            <span className="font-semibold">{comparison.best_store || "N/A"}</span>.
          </p>
          {comparison.substitution_item_name ? (
            <p className="mt-2 text-sm text-roseDeep">
              Substitute option: {comparison.substitution_item_name} could save about ₹{comparison.substitution_saving?.toFixed(0) || "0"}.
            </p>
          ) : null}
          {comparison.substitution_reason ? (
            <p className="mt-2 text-sm text-steel">{comparison.substitution_reason}</p>
          ) : null}
        </div>
        <div className="rounded-md border border-rose/30 bg-blush px-4 py-3 text-sm text-taupe">
          Estimated saving: ₹{comparison.estimated_saving.toFixed(0)}
        </div>
      </div>
      <div className="mt-6 overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th className="pb-3">Outlet</th>
              <th className="pb-3">Offer</th>
              <th className="pb-3">Discount</th>
              <th className="pb-3">Fees</th>
              <th className="pb-3">Stock</th>
              <th className="pb-3">Why</th>
              <th className="pb-3">Choose</th>
            </tr>
          </thead>
          <tbody>
            {comparison.options.map((option) => (
              <tr key={option.store_name}>
                <td className="font-medium text-taupe">
                  {option.store_name}
                  {comparison.best_store === option.store_name ? <span className="ml-2 rounded-sm bg-rose px-2 py-1 text-[0.6rem] font-bold uppercase tracking-[0.14em] text-card">Best</span> : null}
                </td>
                <td className="font-serif text-xl text-taupe">₹{option.offer_price.toFixed(0)}</td>
                <td>{option.discount_percentage.toFixed(0)}%</td>
                <td>₹{(option.delivery_fee + option.travel_cost).toFixed(0)}</td>
                <td>{option.stock_status}</td>
                <td className="text-steel">
                  <div>{option.offer_description}</div>
                  <div className="mt-1 text-xs">{option.why}</div>
                </td>
                <td>
                  <button className={selectedStore === option.store_name ? "btn-primary" : "btn-quiet"} onClick={() => onChoose(option.store_name)} type="button">
                    {selectedStore === option.store_name ? "Chosen" : "Choose"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
