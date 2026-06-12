import type {
  BuyPlanSummary,
  LoginResponse,
  NamedValue,
  Pattern,
  PredictedBasket,
  PriceComparisonItem,
  Receipt,
  Recommendation,
  SavingsReport,
  SavingsTrend,
  ShoppingList,
  StorePrice,
  Summary,
} from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export class AuthError extends Error {}

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    cache: "no-store"
  });

  if (response.status === 401) {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("grocery-token");
    }
    throw new AuthError("Your session expired. Please sign in again.");
  }

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || "Request failed");
  }
  return response.json();
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

export function getCurrentUser(token?: string) {
  return request("/auth/me", {}, token);
}

export function logout(token?: string) {
  return request("/auth/logout", { method: "POST" }, token);
}

export function getSummary(token: string) {
  return request<Summary>("/dashboard/summary", {}, token);
}

export function getMonthlySavings(token: string) {
  return request<SavingsTrend[]>("/dashboard/monthly-savings", {}, token);
}

export function getCategorySpend(token: string) {
  return request<NamedValue[]>("/dashboard/category-spend", {}, token);
}

export function getStoreComparison(token: string) {
  return request<NamedValue[]>("/dashboard/store-comparison", {}, token);
}

export function getTopSavings(token: string) {
  return request<PriceComparisonItem[]>("/dashboard/top-savings", {}, token);
}

export function getSavingsReport(token: string) {
  return request<SavingsReport>("/dashboard/report", {}, token);
}

export async function downloadSavingsReportCsv(token: string) {
  return downloadProtectedFile("/dashboard/report.csv", token, "monthly-savings-report.csv");
}

export function getReceipts(token: string) {
  return request<Receipt[]>("/receipts", {}, token);
}

export function analyzePatterns(token: string) {
  return request<Pattern[]>("/patterns/analyze", { method: "POST" }, token);
}

export function generatePrediction(token: string) {
  return request<PredictedBasket>("/prediction/generate", { method: "POST" }, token);
}

export function getPrediction(token: string) {
  return request<PredictedBasket>("/prediction/next-basket", {}, token);
}

export function comparePrices(token: string) {
  return request<PriceComparisonItem[]>("/prices/compare", {}, token);
}

export function searchPrices(token: string, q: string) {
  return request<StorePrice[]>(`/prices/search?q=${encodeURIComponent(q)}`, {}, token);
}

export function compareSingleItem(token: string, item: string, quantity: number) {
  return request<PriceComparisonItem>(`/prices/compare/${encodeURIComponent(item)}?quantity=${quantity}`, {}, token);
}

export function generateRecommendation(token: string) {
  return request<Recommendation>("/recommendations/generate", { method: "POST" }, token);
}

export function getRecommendation(token: string) {
  return request<Recommendation>("/recommendations/current", {}, token);
}

export function createManualReceipt(token: string, payload: object) {
  return request<Receipt>("/receipts", { method: "POST", body: JSON.stringify(payload) }, token);
}

export async function uploadReceipt(
  token: string,
  payload: {
    store_name: string;
    purchase_date: string;
    receipt_number?: string;
    raw_text?: string;
    total_amount?: number;
    file?: File | null;
  }
) {
  const formData = new FormData();
  formData.set("store_name", payload.store_name);
  formData.set("purchase_date", payload.purchase_date);
  formData.set("upload_type", payload.file ? "image_upload" : "manual");
  formData.set("receipt_number", payload.receipt_number || "");
  formData.set("raw_text", payload.raw_text || "");
  formData.set("total_amount", String(payload.total_amount || 0));
  if (payload.file) {
    formData.set("file", payload.file);
  }
  const response = await fetch(`${API_BASE_URL}/receipts/upload`, {
    method: "POST",
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
    cache: "no-store"
  });
  if (response.status === 401) {
    window.localStorage.removeItem("grocery-token");
    throw new AuthError("Your session expired. Please sign in again.");
  }
  if (!response.ok) {
    throw new Error((await response.text()) || "Upload failed");
  }
  return response.json() as Promise<Receipt>;
}

export function getShoppingList(token: string) {
  return request<ShoppingList>("/shopping/current", {}, token);
}

export function syncShoppingList(token: string) {
  return request<ShoppingList>("/shopping/sync", { method: "POST" }, token);
}

export function getBuyPlan(token: string) {
  return request<BuyPlanSummary>("/shopping/plan", {}, token);
}

export async function downloadBuyPlanCsv(token: string) {
  return downloadProtectedFile("/shopping/export.csv", token, "buy-plan.csv");
}

export function addShoppingItem(token: string, payload: object) {
  return request<ShoppingList>("/shopping/items", { method: "POST", body: JSON.stringify(payload) }, token);
}

export function removeShoppingItem(token: string, shoppingListItemId: number) {
  return request<ShoppingList>(`/shopping/items/${shoppingListItemId}`, { method: "DELETE" }, token);
}

export function selectStoreForItem(token: string, payload: { shopping_list_item_id: number; store_name: string }) {
  return request<ShoppingList>("/shopping/select", { method: "POST", body: JSON.stringify(payload) }, token);
}

export function chooseCheapestForAll(token: string) {
  return request<ShoppingList>("/shopping/bulk/cheapest", { method: "POST" }, token);
}

export function chooseSingleStoreForAll(token: string, storeName: string) {
  return request<ShoppingList>("/shopping/bulk/store", { method: "POST", body: JSON.stringify({ store_name: storeName }) }, token);
}

async function downloadProtectedFile(path: string, token: string, filename: string) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store"
  });
  if (!response.ok) {
    throw new Error((await response.text()) || "Download failed");
  }
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.URL.revokeObjectURL(url);
}
