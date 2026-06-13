import type {
  BuyPlanSummary,
  BatchReceiptImport,
  LoginResponse,
  NamedValue,
  PantryItem,
  PantrySyncResult,
  Pattern,
  PriceImportResult,
  PredictedBasket,
  PriceComparisonItem,
  Receipt,
  Recommendation,
  ReceiptPreview,
  SavingsReport,
  SavingsTrend,
  ShoppingList,
  StorePrice,
  Summary,
} from "@/lib/types";

function getApiBaseUrl() {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }
  return "http://localhost:8000";
}

export class AuthError extends Error {}

function buildAuthHeaders(options: RequestInit = {}): HeadersInit {
  return {
    ...(options.headers || {})
  };
}

function handleUnauthorized() {
  throw new AuthError("Your session expired. Please sign in again.");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(options)
    },
    cache: "no-store"
  });

  if (response.status === 401) {
    handleUnauthorized();
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

export function getCurrentUser() {
  return request("/auth/me");
}

export function logout() {
  return request("/auth/logout", { method: "POST" });
}

export function getSummary() {
  return request<Summary>("/dashboard/summary");
}

export function getMonthlySavings() {
  return request<SavingsTrend[]>("/dashboard/monthly-savings");
}

export function getCategorySpend() {
  return request<NamedValue[]>("/dashboard/category-spend");
}

export function getStoreComparison() {
  return request<NamedValue[]>("/dashboard/store-comparison");
}

export function getTopSavings() {
  return request<PriceComparisonItem[]>("/dashboard/top-savings");
}

export function getSavingsReport() {
  return request<SavingsReport>("/dashboard/report");
}

export async function downloadSavingsReportCsv() {
  return downloadProtectedFile("/dashboard/report.csv", "monthly-savings-report.csv");
}

export function getReceipts() {
  return request<Receipt[]>("/receipts");
}

export function analyzePatterns() {
  return request<Pattern[]>("/patterns/analyze", { method: "POST" });
}

export function generatePrediction() {
  return request<PredictedBasket>("/prediction/generate", { method: "POST" });
}

export function getPrediction() {
  return request<PredictedBasket>("/prediction/next-basket");
}

export function comparePrices() {
  return request<PriceComparisonItem[]>("/prices/compare");
}

export async function importPricesCsv(payload: { source: string; file: File }) {
  const formData = new FormData();
  formData.set("source", payload.source);
  formData.set("file", payload.file);
  const response = await fetch(`${getApiBaseUrl()}/prices/import-csv`, {
    method: "POST",
    credentials: "include",
    body: formData,
    cache: "no-store"
  });
  if (response.status === 401) {
    handleUnauthorized();
  }
  if (!response.ok) {
    throw new Error((await response.text()) || "Price import failed");
  }
  return response.json() as Promise<PriceImportResult>;
}

export function searchPrices(q: string) {
  return request<StorePrice[]>(`/prices/search?q=${encodeURIComponent(q)}`);
}

export function compareSingleItem(item: string, quantity: number) {
  return request<PriceComparisonItem>(`/prices/compare/${encodeURIComponent(item)}?quantity=${quantity}`);
}

export function generateRecommendation() {
  return request<Recommendation>("/recommendations/generate", { method: "POST" });
}

export function getRecommendation() {
  return request<Recommendation>("/recommendations/current");
}

export function createManualReceipt(payload: object) {
  return request<Receipt>("/receipts", { method: "POST", body: JSON.stringify(payload) });
}

export async function uploadReceipt(
  payload: {
    store_name: string;
    purchase_date: string;
    receipt_number?: string;
    raw_text?: string;
    total_amount?: number;
    items?: object[];
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
  if (payload.items?.length) {
    formData.set("items_json", JSON.stringify(payload.items));
  }
  if (payload.file) {
    formData.set("file", payload.file);
  }
  const response = await fetch(`${getApiBaseUrl()}/receipts/upload`, {
    method: "POST",
    credentials: "include",
    body: formData,
    cache: "no-store"
  });
  if (response.status === 401) {
    handleUnauthorized();
  }
  if (!response.ok) {
    throw new Error((await response.text()) || "Upload failed");
  }
  return response.json() as Promise<Receipt>;
}

export async function uploadReceiptBatchPdf(
  payload: {
    file: File;
    purchase_date_fallback?: string;
  }
) {
  const formData = new FormData();
  formData.set("file", payload.file);
  if (payload.purchase_date_fallback) {
    formData.set("purchase_date_fallback", payload.purchase_date_fallback);
  }
  const response = await fetch(`${getApiBaseUrl()}/receipts/upload-batch-pdf`, {
    method: "POST",
    credentials: "include",
    body: formData,
    cache: "no-store"
  });
  if (response.status === 401) {
    handleUnauthorized();
  }
  if (!response.ok) {
    throw new Error((await response.text()) || "Batch PDF upload failed");
  }
  return response.json() as Promise<BatchReceiptImport>;
}

export function previewReceipt(payload: {
  store_name: string;
  purchase_date: string;
  raw_text?: string;
  file?: File | null;
}) {
  const formData = new FormData();
  formData.set("store_name", payload.store_name);
  formData.set("purchase_date", payload.purchase_date);
  formData.set("raw_text", payload.raw_text || "");
  if (payload.file) {
    formData.set("file", payload.file);
  }
  return fetch(`${getApiBaseUrl()}/receipts/preview`, {
    method: "POST",
    credentials: "include",
    body: formData,
    cache: "no-store"
  }).then(async (response) => {
    if (response.status === 401) {
      handleUnauthorized();
    }
    if (!response.ok) {
      throw new Error((await response.text()) || "Preview failed");
    }
    return response.json() as Promise<ReceiptPreview>;
  });
}

export function getShoppingList() {
  return request<ShoppingList>("/shopping/current");
}

export function getPantry() {
  return request<PantryItem[]>("/pantry/current");
}

export function syncPantry() {
  return request<PantrySyncResult>("/pantry/sync", { method: "POST" });
}

export function syncShoppingList() {
  return request<ShoppingList>("/shopping/sync", { method: "POST" });
}

export function getBuyPlan() {
  return request<BuyPlanSummary>("/shopping/plan");
}

export async function downloadBuyPlanCsv() {
  return downloadProtectedFile("/shopping/export.csv", "buy-plan.csv");
}

export function addShoppingItem(payload: object) {
  return request<ShoppingList>("/shopping/items", { method: "POST", body: JSON.stringify(payload) });
}

export function removeShoppingItem(shoppingListItemId: number) {
  return request<ShoppingList>(`/shopping/items/${shoppingListItemId}`, { method: "DELETE" });
}

export function selectStoreForItem(payload: { shopping_list_item_id: number; store_name: string }) {
  return request<ShoppingList>("/shopping/select", { method: "POST", body: JSON.stringify(payload) });
}

export function chooseCheapestForAll() {
  return request<ShoppingList>("/shopping/bulk/cheapest", { method: "POST" });
}

export function chooseSingleStoreForAll(storeName: string) {
  return request<ShoppingList>("/shopping/bulk/store", { method: "POST", body: JSON.stringify({ store_name: storeName }) });
}

async function downloadProtectedFile(path: string, filename: string) {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    credentials: "include",
    cache: "no-store"
  });
  if (response.status === 401) {
    handleUnauthorized();
  }
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
