export type LoginResponse = {
  access_token: string;
  token_type: string;
};

export type Summary = {
  bills_uploaded: number;
  monthly_grocery_spend: number;
  optimized_grocery_spend: number;
  monthly_savings: number;
  lifetime_savings: number;
  savings_percentage: number;
  currency_code: string;
  currency_symbol: string;
  region: string;
  budget_status: BudgetStatus;
  notifications: DashboardNotification[];
  prediction_accuracy?: PredictionAccuracySummary | null;
};

export type NamedValue = {
  name: string;
  value: number;
};

export type BudgetStatus = {
  monthly_budget?: number | null;
  projected_spend: number;
  selected_spend: number;
  remaining_budget?: number | null;
  budget_utilization_pct?: number | null;
  over_budget: boolean;
  warning?: string | null;
};

export type DashboardNotification = {
  title: string;
  message: string;
  kind: string;
  item_name?: string | null;
  store_name?: string | null;
  savings_amount?: number | null;
};

export type PredictionAccuracySummary = {
  prediction_month?: string | null;
  matched_items: number;
  predicted_items: number;
  actual_items: number;
  match_rate: number;
  spend_accuracy_pct: number;
  confidence_delta: number;
};

export type SavingsTrend = {
  month: string;
  actual_spend: number;
  optimized_spend: number;
  savings: number;
};

export type SavingsLeaderboardEntry = {
  month: string;
  savings: number;
  rank: number;
};

export type SavingsReport = {
  leaderboard: SavingsLeaderboardEntry[];
  monthly_savings: SavingsTrend[];
};

export type ReceiptItem = {
  id?: number;
  item_name: string;
  normalized_item_name: string;
  brand?: string | null;
  category?: string | null;
  quantity: number;
  unit?: string | null;
  pack_size?: string | null;
  unit_price: number;
  total_price: number;
  discount: number;
  offer_applied?: string | null;
  store_name: string;
  purchase_date: string;
};

export type Receipt = {
  id: number;
  store_name: string;
  receipt_number?: string | null;
  purchase_date: string;
  total_amount: number;
  upload_type: string;
  file_name?: string | null;
  file_path?: string | null;
  mime_type?: string | null;
  file_size_bytes?: number | null;
  extraction_method?: string | null;
  raw_text?: string | null;
  created_at: string;
  items: ReceiptItem[];
};

export type Pattern = {
  id: number;
  normalized_item_name: string;
  item_name: string;
  average_purchase_quantity: number;
  average_price_paid: number;
  purchase_frequency_days: number;
  preferred_store?: string | null;
  usual_monthly_quantity: number;
  category?: string | null;
  category_spend: number;
  predicted_next_purchase_date: string;
  confidence_score: number;
};

export type PredictedBasketItem = {
  id: number;
  item_name: string;
  normalized_item_name: string;
  category?: string | null;
  predicted_quantity: number;
  expected_purchase_date: string;
  average_price_usually_paid: number;
  confidence_score: number;
};

export type PredictedBasket = {
  id: number;
  prediction_month: string;
  expected_total_spend: number;
  items: PredictedBasketItem[];
};

export type StorePrice = {
  id: number;
  store_name: string;
  item_name: string;
  normalized_item_name: string;
  brand?: string | null;
  pack_size?: string | null;
  regular_price: number;
  offer_price: number;
  discount_percentage: number;
  offer_description?: string | null;
  valid_from: string;
  valid_to: string;
  in_stock: boolean;
  stock_status: string;
};

export type StoreOption = {
  store_name: string;
  regular_price: number;
  offer_price: number;
  discount_percentage: number;
  offer_description?: string | null;
  in_stock: boolean;
  stock_status: string;
  delivery_fee: number;
  travel_cost: number;
  convenience_index: number;
  effective_total: number;
  recommendation_score: number;
};

export type PriceComparisonItem = {
  item_name: string;
  normalized_item_name: string;
  category?: string | null;
  average_price_paid: number;
  predicted_quantity: number;
  cheapest_store?: string | null;
  highest_discount_store?: string | null;
  best_offer?: string | null;
  regular_price?: number | null;
  offer_price?: number | null;
  estimated_saving: number;
  best_store?: string | null;
  second_best_store?: string | null;
  difference_to_second_best: number;
  substitution_item_name?: string | null;
  substitution_saving?: number | null;
  options: StoreOption[];
};

export type Recommendation = {
  id: number;
  prediction_month: string;
  best_single_store: string;
  best_single_store_cost: number;
  best_multi_store_cost: number;
  expected_spend: number;
  optimized_spend: number;
  total_estimated_saving: number;
  savings_percentage: number;
  convenience_note?: string | null;
  recommendation_strategy: string;
};

export type StoreSelection = {
  id: number;
  store_name: string;
  selected_price: number;
  quantity: number;
  selected_at: string;
};

export type ShoppingListItem = {
  id: number;
  item_name: string;
  normalized_item_name: string;
  category?: string | null;
  predicted_quantity: number;
  average_price_usually_paid: number;
  is_recommended: boolean;
  source: string;
  selected_store_items: StoreSelection[];
};

export type ShoppingList = {
  id: number;
  prediction_month: string;
  title: string;
  status: string;
  expected_total_spend: number;
  optimized_total_spend: number;
  created_at: string;
  updated_at: string;
  items: ShoppingListItem[];
};

export type BuyPlanSummary = {
  shopping_list: ShoppingList;
  comparisons: PriceComparisonItem[];
  selected_total_spend: number;
  selected_items_count: number;
  stores_used: string[];
  budget_status: BudgetStatus;
  notifications: DashboardNotification[];
};
