// Spend & Send - TypeScript Types

// ============================================
// Database Models
// ============================================

export interface User {
  id: string;
  email?: string;
  name?: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface PayPeriod {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  income_amount: number;
  four_walls_total: number;
  discretionary_pool: number;
  per_diem: number;
  days_until_payday: number;
  is_active: boolean;
  created_at: string;
}

export interface FourWallsAllocation {
  id: string;
  pay_period_id: string;
  category: FourWallsCategory;
  allocated_amount: number;
  spent_amount: number;
  created_at: string;
}

export interface Category {
  id: string;
  user_id?: string;
  name: string;
  type: 'four_walls' | 'discretionary';
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  pay_period_id: string;
  category_id: string;
  amount: number;
  description?: string;
  merchant?: string;
  transaction_date: string;
  transaction_time?: string;
  type: 'income' | 'expense' | 'four_walls' | 'transfer';
  is_four_walls: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PerDiemTracking {
  id: string;
  pay_period_id: string;
  tracking_date: string;
  per_diem_amount: number;
  remaining_amount: number;
  spent_today: number;
  rollover_from_previous: number;
  created_at: string;
}

export interface Setting {
  id: string;
  user_id: string;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export interface Receipt {
  id: string;
  transaction_id: string;
  image_path?: string;
  extracted_amount?: number;
  extracted_merchant?: string;
  extracted_date?: string;
  ocr_confidence?: number;
  created_at: string;
}

// ============================================
// Category Types
// ============================================

export type FourWallsCategory = 
  | 'Housing'
  | 'Utilities'
  | 'Groceries'
  | 'Transportation'
  | 'Debt'
  | 'Savings';

export type DiscretionaryCategory =
  | 'Dining'
  | 'Coffee'
  | 'Shopping'
  | 'Entertainment'
  | 'Subscriptions'
  | 'Health'
  | 'Personal'
  | 'Kids/Family'
  | 'Pets'
  | 'Gifts'
  | 'Travel'
  | 'Misc';

// ============================================
// API Response Types
// ============================================

export interface ParsedTransaction {
  amount: number;
  description: string;
  category: string;
  merchant?: string;
  date: string;
  type: 'income' | 'expense' | 'four_walls';
  is_four_walls: boolean;
  confidence: number;
}

export interface AssistantResponse {
  message: string;
  action?: 'log_transaction' | 'update_transaction' | 'show_summary' | 'answer_question' | 'setup_payday';
  parsed_transaction?: ParsedTransaction;
  summary?: PeriodSummary;
  insight?: string;
  chart_config?: ChartConfig;
}

export interface PeriodSummary {
  income: number;
  four_walls_total: number;
  four_walls_breakdown: { category: string; amount: number }[];
  discretionary_total: number;
  discretionary_breakdown: { category: string; amount: number }[];
  per_diem: number;
  per_diem_remaining_today: number;
  days_until_payday: number;
  days_under_per_diem: number;
  days_over_per_diem: number;
}

export interface ChartConfig {
  type: 'bar' | 'pie' | 'line';
  labels: string[];
  data: number[];
  title?: string;
}

// ============================================
// Settings Keys
// ============================================

export type SettingKey =
  | 'pay_schedule'
  | 'next_payday_date'
  | 'variable_income_mode'
  | 'safety_buffer_amount'
  | 'default_four_walls_housing'
  | 'default_four_walls_utilities'
  | 'default_four_walls_groceries'
  | 'default_four_walls_transportation'
  | 'default_four_walls_debt'
  | 'default_four_walls_savings';
