"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";

import { AuthGate } from "@/components/auth-gate";
import { getPrediction, searchPrices } from "@/lib/api";
import type { PredictedBasketItem, StorePrice } from "@/lib/types";


function formatCurrency(value: number) {
  return `₹${value.toFixed(0)}`;
}


function BuyingPageContent() {
  const [token, setToken] = useState("");
  const [search, setSearch] = useState("");
  const [selectedItemKey, setSelectedItemKey] = useState("");
  const [chosenStores, setChosenStores] = useState<Record<string, string>>({});
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedItem = searchParams.get("item") || "";

  useEffect(() => {
    setToken(window.localStorage.getItem("grocery-token") || "");
  }, []);

  const prediction = useQuery({
    queryKey: ["prediction-buy-page", token],
    queryFn: () => getPrediction(token),
    enabled: !!token,
    retry: false
  });

  useEffect(() => {
    if (!prediction.data?.items?.length) {
      return;
    }

    if (requestedItem) {
      const matched = prediction.data.items.find((item) => item.normalized_item_name.includes(requestedItem.toLowerCase()));
      if (matched) {
        setSelectedItemKey(matched.normalized_item_name);
        setSearch(matched.normalized_item_name);
        return;
      }
    }

    if (!selectedItemKey) {
      setSelectedItemKey(prediction.data.items[0].normalized_item_name);
    }
  }, [prediction.data, requestedItem, selectedItemKey]);

  const recommendedItems = prediction.data?.items || [];

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) {
      return recommendedItems;
    }
    return recommendedItems.filter((item) => {
      return (
        item.item_name.toLowerCase().includes(normalizedSearch) ||
        item.normalized_item_name.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [recommendedItems, search]);

  const activeItem: PredictedBasketItem | undefined =
    filteredItems.find((item) => item.normalized_item_name === selectedItemKey) ||
    recommendedItems.find((item) => item.normalized_item_name === selectedItemKey) ||
    filteredItems[0];

  const storePrices = useQuery({
    queryKey: ["store-prices", token, activeItem?.normalized_item_name],
    queryFn: () => searchPrices(token, activeItem?.normalized_item_name || ""),
    enabled: !!token && !!activeItem?.normalized_item_name
  });

  const sortedStorePrices: StorePrice[] = useMemo(() => {
    return [...(storePrices.data || [])].sort((left, right) => left.offer_price - right.offer_price);
  }, [storePrices.data]);

  const cheapestOffer = sortedStorePrices[0];
  const currentChosenStore = activeItem ? chosenStores[activeItem.normalized_item_name] : undefined;

  function chooseItem(item: PredictedBasketItem) {
    setSelectedItemKey(item.normalized_item_name);
    setSearch(item.normalized_item_name);
    router.replace(`/buy?item=${encodeURIComponent(item.normalized_item_name)}`);
  }

  function chooseStore(itemKey: string, storeName: string) {
    setChosenStores((current) => ({ ...current, [itemKey]: storeName }));
  }

  const chosenSummary = recommendedItems.map((item) => ({
    item_name: item.item_name,
    normalized_item_name: item.normalized_item_name,
    store_name: chosenStores[item.normalized_item_name] || "Not chosen yet"
  }));

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      <section className="panel">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-ink/50">Buying Page</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight">Search recommended groceries and compare outlet prices before you choose.</h1>
            <p className="mt-3 max-w-3xl text-sm text-slate-600">
              This page shows the items predicted for your next basket, then lets you drill into one item and compare live demo prices across Dmart, JioMart, BigBasket, Blinkit, and Reliance Fresh.
            </p>
          </div>
          <Link className="btn-secondary text-center" href="/">
            Back to Dashboard
          </Link>
        </div>

        <div className="mt-6 flex flex-col gap-3 lg:flex-row">
          <input
            className="input"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search milk, rice, detergent..."
            value={search}
          />
          <button
            className="btn-primary"
            onClick={() => {
              if (filteredItems[0]) {
                chooseItem(filteredItems[0]);
              }
            }}
            type="button"
          >
            Search Buying Options
          </button>
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.25fr]">
        <div className="panel">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recommended Items To Buy</h2>
            <span className="text-sm text-slate-500">{filteredItems.length} items</span>
          </div>
          <div className="mt-4 space-y-3">
            {filteredItems.map((item) => {
              const isActive = activeItem?.normalized_item_name === item.normalized_item_name;
              const chosenStore = chosenStores[item.normalized_item_name];
              return (
                <button
                  className={`w-full rounded-3xl border p-4 text-left transition ${isActive ? "border-saffron bg-saffron/10" : "border-slate-200 bg-white hover:border-ink/20"}`}
                  key={item.id}
                  onClick={() => chooseItem(item)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{item.item_name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Qty {item.predicted_quantity} | Avg {formatCurrency(item.average_price_usually_paid)} | Need by {item.expected_purchase_date}
                      </p>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <div>{Math.round(item.confidence_score * 100)}% confidence</div>
                      <div className="mt-2 rounded-full bg-mint px-3 py-1 text-ink">{chosenStore || "Pick a store"}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="panel">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold">{activeItem?.item_name || "Choose an item"}</h2>
                {activeItem ? (
                  <p className="mt-2 text-sm text-slate-600">
                    Recommended quantity: {activeItem.predicted_quantity}. Average paid earlier: {formatCurrency(activeItem.average_price_usually_paid)}.
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-slate-600">Search or select a recommended item to view price comparisons.</p>
                )}
              </div>
              {cheapestOffer && activeItem ? (
                <div className="rounded-3xl bg-mint px-4 py-3 text-sm text-ink">
                  Best current offer: <span className="font-semibold">{cheapestOffer.store_name}</span> at {formatCurrency(cheapestOffer.offer_price)}
                </div>
              ) : null}
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-slate-500">
                  <tr>
                    <th className="pb-3">Outlet</th>
                    <th className="pb-3">Regular</th>
                    <th className="pb-3">Offer</th>
                    <th className="pb-3">Discount</th>
                    <th className="pb-3">Offer Note</th>
                    <th className="pb-3">Choose</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedStorePrices.map((price) => {
                    const isChosen = currentChosenStore === price.store_name;
                    return (
                      <tr className="border-t border-slate-100" key={price.id}>
                        <td className="py-3 font-medium">{price.store_name}</td>
                        <td className="py-3">{formatCurrency(price.regular_price)}</td>
                        <td className="py-3">{formatCurrency(price.offer_price)}</td>
                        <td className="py-3">{price.discount_percentage.toFixed(0)}%</td>
                        <td className="py-3 text-slate-500">{price.offer_description}</td>
                        <td className="py-3">
                          <button
                            className={isChosen ? "btn-primary" : "btn-secondary"}
                            onClick={() => activeItem && chooseStore(activeItem.normalized_item_name, price.store_name)}
                            type="button"
                          >
                            {isChosen ? "Chosen" : "Choose"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!sortedStorePrices.length ? <p className="py-6 text-sm text-slate-500">No outlet prices found for this item yet.</p> : null}
            </div>
          </div>

          <div className="panel">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Your Current Buying Choices</h2>
              <span className="text-sm text-slate-500">{Object.keys(chosenStores).length} selected</span>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-slate-500">
                  <tr>
                    <th className="pb-3">Recommended Item</th>
                    <th className="pb-3">Chosen Outlet</th>
                  </tr>
                </thead>
                <tbody>
                  {chosenSummary.map((item) => (
                    <tr className="border-t border-slate-100" key={item.normalized_item_name}>
                      <td className="py-3">{item.item_name}</td>
                      <td className="py-3">{item.store_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}


export default function BuyPage() {
  return (
    <AuthGate>
      <BuyingPageContent />
    </AuthGate>
  );
}
