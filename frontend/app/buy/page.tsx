"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { AppShell } from "@/components/app-shell";
import { AuthGate } from "@/components/auth-gate";
import { PriceComparisonTable } from "@/components/price-comparison-table";
import { RecommendedItemsList } from "@/components/recommended-items-list";
import { SearchBar } from "@/components/search-bar";
import { StoreChoiceSummary } from "@/components/store-choice-summary";
import {
  addShoppingItem,
  chooseCheapestForAll,
  chooseSingleStoreForAll,
  compareSingleItem,
  downloadBuyPlanCsv,
  generatePrediction,
  getBuyPlan,
  getPrediction,
  removeShoppingItem,
  searchPrices,
  selectStoreForItem,
  syncShoppingList,
} from "@/lib/api";
import type { ShoppingListItem } from "@/lib/types";


function BuyPageScreen() {
  const [token, setToken] = useState("");
  const [search, setSearch] = useState("");
  const [activeItemKey, setActiveItemKey] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    setToken(window.localStorage.getItem("grocery-token") || "cookie");
    setRecentSearches(JSON.parse(window.localStorage.getItem("grocery-recent-searches") || "[]"));
  }, []);

  const plan = useQuery({
    queryKey: ["buy-plan", token],
    queryFn: () => getBuyPlan(token),
    enabled: !!token,
    retry: false
  });

  const prediction = useQuery({
    queryKey: ["buy-prediction", token],
    queryFn: () => getPrediction(token),
    enabled: !!token,
    retry: false
  });

  const searchResults = useQuery({
    queryKey: ["catalog-search", token, search],
    queryFn: () => searchPrices(token, search),
    enabled: !!token && search.trim().length > 0
  });

  const activeItem = plan.data?.shopping_list.items.find((item) => item.normalized_item_name === activeItemKey);
  const activeComparison = plan.data?.comparisons.find((item) => item.normalized_item_name === activeItemKey);
  const storeOptions = useMemo(() => [...new Set((searchResults.data || []).map((entry) => entry.store_name))], [searchResults.data]);

  useEffect(() => {
    if (!plan.data?.shopping_list.items.length) {
      return;
    }
    if (!activeItemKey) {
      setActiveItemKey(plan.data.shopping_list.items[0].normalized_item_name);
    }
  }, [plan.data, activeItemKey]);

  const refreshPlan = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["buy-plan", token] }),
      queryClient.invalidateQueries({ queryKey: ["buy-prediction", token] }),
      queryClient.invalidateQueries({ queryKey: ["catalog-search", token] })
    ]);
  };

  const setupMutation = useMutation({
    mutationFn: async () => {
      try {
        await syncShoppingList(token);
      } catch {
        await generatePrediction(token);
        await syncShoppingList(token);
      }
    },
    onSuccess: refreshPlan
  });

  const addItemMutation = useMutation({
    mutationFn: (payload: { item_name: string; normalized_item_name: string }) =>
      addShoppingItem(token, {
        ...payload,
        predicted_quantity: 1,
        average_price_usually_paid: 0,
        category: "Manual Add"
      }),
    onSuccess: refreshPlan
  });

  const selectMutation = useMutation({
    mutationFn: (payload: { shopping_list_item_id: number; store_name: string }) => selectStoreForItem(token, payload),
    onSuccess: refreshPlan
  });

  const cheapestMutation = useMutation({
    mutationFn: () => chooseCheapestForAll(token),
    onSuccess: refreshPlan
  });

  const singleStoreMutation = useMutation({
    mutationFn: (storeName: string) => chooseSingleStoreForAll(token, storeName),
    onSuccess: refreshPlan
  });

  const suggestions = useMemo(() => {
    const values = new Set<string>();
    for (const item of plan.data?.shopping_list.items || []) {
      values.add(item.item_name);
      values.add(item.normalized_item_name);
    }
    for (const entry of searchResults.data || []) {
      values.add(entry.item_name);
      values.add(entry.normalized_item_name);
    }
    return [...values];
  }, [plan.data, searchResults.data]);

  async function handleSearchSubmit() {
    const normalized = search.trim().toLowerCase();
    if (!normalized) {
      return;
    }
    const existing = plan.data?.shopping_list.items.find(
      (item) => item.normalized_item_name.includes(normalized) || item.item_name.toLowerCase().includes(normalized)
    );
    if (existing) {
      setActiveItemKey(existing.normalized_item_name);
    } else {
      const single = await compareSingleItem(token, normalized, 1);
      if (single.item_name) {
        await addItemMutation.mutateAsync({
          item_name: single.item_name,
          normalized_item_name: single.normalized_item_name
        });
        setActiveItemKey(single.normalized_item_name);
      }
    }
    const updatedRecent = [normalized, ...recentSearches.filter((item) => item !== normalized)].slice(0, 6);
    setRecentSearches(updatedRecent);
    window.localStorage.setItem("grocery-recent-searches", JSON.stringify(updatedRecent));
  }

  function currentSelectionFor(item: ShoppingListItem) {
    return item.selected_store_items.at(-1)?.store_name;
  }

  return (
    <AppShell>
      <section className="page-head">
        <div>
          <p className="eyebrow text-rose">Primary workflow</p>
          <h2 className="page-title mt-2">Predicted basket, priced across every outlet.</h2>
          <p className="page-copy">
            Search any item at the top, compare offers across outlets, pick your store item by item, or bulk-select the lowest-cost plan in one click.
          </p>
        </div>
        <div className="flex items-end gap-5">
          <div>
            <p className="eyebrow">Current cycle</p>
            <p className="mt-1 font-serif text-3xl font-medium text-taupe">{plan.data?.shopping_list.items.length || 0} items</p>
          </div>
          <button className="btn-quiet" onClick={() => void downloadBuyPlanCsv(token)} type="button">Export CSV</button>
          <button className="btn-secondary" onClick={() => setupMutation.mutate()} type="button">
            Refresh Recommended Basket
          </button>
        </div>
      </section>

      <section className="mt-8">
        <SearchBar
          onChange={setSearch}
          onSelect={(value) => {
            setSearch(value);
            const match = plan.data?.shopping_list.items.find(
              (item) => item.normalized_item_name.includes(value.toLowerCase()) || item.item_name.toLowerCase().includes(value.toLowerCase())
            );
            if (match) {
              setActiveItemKey(match.normalized_item_name);
            }
          }}
          onSubmit={handleSearchSubmit}
          recentSearches={recentSearches}
          suggestions={suggestions}
          value={search}
        />
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.2fr_0.95fr]">
        <RecommendedItemsList
          activeItemKey={activeItemKey}
          comparisons={plan.data?.comparisons || []}
          items={plan.data?.shopping_list.items || []}
          onRemove={(itemId) => {
            void removeShoppingItem(token, itemId).then(refreshPlan);
          }}
          onSelect={(item) => setActiveItemKey(item.normalized_item_name)}
        />
        <PriceComparisonTable
          comparison={activeComparison}
          onChoose={(storeName) => {
            if (!activeItem) {
              return;
            }
            selectMutation.mutate({ shopping_list_item_id: activeItem.id, store_name: storeName });
          }}
          selectedStore={activeItem ? currentSelectionFor(activeItem) : undefined}
        />
        <StoreChoiceSummary
          onChooseCheapest={() => cheapestMutation.mutate()}
          onChooseStore={(storeName) => singleStoreMutation.mutate(storeName)}
          plan={plan.data}
          storeOptions={storeOptions}
        />
      </section>
      {plan.data?.notifications?.length ? (
        <section className="panel mt-8 p-5">
          <h3 className="eyebrow">Price drop and availability notifications</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {plan.data.notifications.map((notification, index) => (
              <div className="soft-card p-4" key={`${notification.title}-${index}`}>
                <div className="font-semibold text-taupe">{notification.title}</div>
                <div className="mt-1 text-sm text-steel">{notification.message}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {!plan.data && !plan.isLoading ? (
        <section className="panel mt-8 p-5">
          <h3 className="font-serif text-2xl font-medium text-taupe">No shopping list yet</h3>
          <p className="mt-3 text-sm text-steel">
            Generate or sync a predicted basket first. If prediction data is missing, the refresh button above will rebuild it from purchase history.
          </p>
        </section>
      ) : null}
    </AppShell>
  );
}


export default function BuyPage() {
  return (
    <AuthGate>
      <BuyPageScreen />
    </AuthGate>
  );
}
