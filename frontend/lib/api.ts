import type {
  LoginResponse,
  NamedValue,
  Pattern,
  PredictedBasket,
  PriceComparisonItem,
  Receipt,
  Recommendation,
  SavingsTrend,
  StorePrice,
  Summary,
} from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    cache: "no-store"
  });

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

export function getReceipts(token: string) {
  return request<Receipt[]>("/receipts", {}, token);
}

export function analyzePatterns(token: string) {
  return request<Pattern[]>("/patterns/analyze", { method: "POST" }, token);
}

export function getPatterns(token: string) {
  return request<Pattern[]>("/patterns", {}, token);
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

export function generateRecommendation(token: string) {
  return request<Recommendation>("/recommendations/generate", { method: "POST" }, token);
}

export function getRecommendation(token: string) {
  return request<Recommendation>("/recommendations/current", {}, token);
}

export function createManualReceipt(token: string, payload: object) {
  return request<Receipt>("/receipts", { method: "POST", body: JSON.stringify(payload) }, token);
}
