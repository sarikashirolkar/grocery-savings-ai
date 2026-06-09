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
};

export type NamedValue = {
  name: string;
  value: number;
};

export type SavingsTrend = {
  month: string;
  actual_spend: number;
  optimized_spend: number;
  savings: number;
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

export type PriceComparisonItem = {
  item_name: string;
  normalized_item_name: string;
  average_price_paid: number;
  cheapest_store?: string | null;
  highest_discount_store?: string | null;
  best_offer?: string | null;
  regular_price?: number | null;
  offer_price?: number | null;
  estimated_saving: number;
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
};
