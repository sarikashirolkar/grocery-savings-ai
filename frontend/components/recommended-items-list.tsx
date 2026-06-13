"use client";

import type { PantryItem, PriceComparisonItem, ShoppingListItem } from "@/lib/types";


type RecommendedItemsListProps = {
  items: ShoppingListItem[];
  comparisons: PriceComparisonItem[];
  pantryItems?: PantryItem[];
  activeItemKey?: string;
  onSelect: (item: ShoppingListItem) => void;
  onRemove: (itemId: number) => void;
};


export function RecommendedItemsList({ items, comparisons, pantryItems, activeItemKey, onSelect, onRemove }: RecommendedItemsListProps) {
  const comparisonMap = Object.fromEntries(comparisons.map((comparison) => [comparison.normalized_item_name, comparison]));
  const pantryMap = Object.fromEntries((pantryItems || []).map((item) => [item.normalized_item_name, item]));
  const grouped = items.reduce<Record<string, ShoppingListItem[]>>((accumulator, item) => {
    const key = item.category || "Other";
    accumulator[key] = accumulator[key] || [];
    accumulator[key].push(item);
    return accumulator;
  }, {});

  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between border-b border-lineSoft pb-4">
        <h2 className="eyebrow">Recommended basket</h2>
        <span className="text-sm text-steel">{String(items.length).padStart(2, "0")} items</span>
      </div>
      <div className="mt-4 space-y-5">
        {Object.entries(grouped).map(([category, group]) => (
          <div key={category}>
            <h3 className="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-steel">{category}</h3>
            <div className="space-y-3">
              {group.map((item) => {
                const comparison = comparisonMap[item.normalized_item_name];
                const pantry = pantryMap[item.normalized_item_name];
                const latestSelection = item.selected_store_items.at(-1);
                const active = activeItemKey === item.normalized_item_name;
                return (
                  <div className={`rounded-md border p-4 transition ${active ? "border-rose bg-blush/40 shadow-inset" : "border-lineSoft bg-card"}`} key={item.id}>
                    <button className="w-full text-left" onClick={() => onSelect(item)} type="button">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-serif text-2xl font-medium tracking-[-0.02em] text-taupe">{item.item_name}</div>
                          <div className="mt-1 text-sm text-steel">
                            Qty {item.predicted_quantity} | Avg ₹{item.average_price_usually_paid.toFixed(0)}
                          </div>
                          {comparison?.best_store ? (
                            <div className="mt-2 text-sm text-taupe">
                              Best: {comparison.best_store} | Second: {comparison.second_best_store} | Gap ₹{comparison.difference_to_second_best.toFixed(0)}
                            </div>
                          ) : (
                            <div className="mt-2 text-sm text-steel">No current store prices available.</div>
                          )}
                          {pantry ? (
                            <div className="mt-2 text-sm text-steel">
                              Pantry: {pantry.on_hand_quantity.toFixed(1)} left | {pantry.buy_timing.replace("_", " ")} | {pantry.days_remaining.toFixed(0)} days remaining
                            </div>
                          ) : null}
                        </div>
                        <div className="text-right text-sm">
                          <div className="inline-flex rounded-md border border-line bg-canvas px-3 py-1 text-taupe">{latestSelection?.store_name || "Pick store"}</div>
                          {!item.is_recommended ? (
                            <button className="mt-3 text-xs text-roseDeep underline decoration-rose decoration-2 underline-offset-4" onClick={(event) => {
                              event.stopPropagation();
                              onRemove(item.id);
                            }} type="button">
                              Remove
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
