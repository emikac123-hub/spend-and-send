// Spend & Send - SQLite Database Schema

// ============================================
// Helper: Generate UUID
// ============================================

export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// ============================================
// Table Creation SQL
// ============================================

export const CREATE_TABLES_SQL = `
-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    name TEXT,
    currency TEXT DEFAULT 'USD',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Pay Periods Table
CREATE TABLE IF NOT EXISTS pay_periods (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    income_amount REAL NOT NULL,
    four_walls_total REAL NOT NULL,
    discretionary_pool REAL NOT NULL,
    per_diem REAL NOT NULL,
    days_until_payday INTEGER NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_pay_periods_user_active ON pay_periods(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_pay_periods_dates ON pay_periods(start_date, end_date);

-- Four Walls Allocations Table
CREATE TABLE IF NOT EXISTS four_walls_allocations (
    id TEXT PRIMARY KEY,
    pay_period_id TEXT NOT NULL,
    category TEXT NOT NULL,
    allocated_amount REAL NOT NULL,
    spent_amount REAL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (pay_period_id) REFERENCES pay_periods(id)
);

CREATE INDEX IF NOT EXISTS idx_four_walls_period ON four_walls_allocations(pay_period_id);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('predictable_expenses', 'discretionary')),
    is_default INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
      pay_period_id TEXT NOT NULL,
    category_id TEXT NOT NULL,
    amount REAL NOT NULL,
    description TEXT,
    merchant TEXT,
    transaction_date TEXT NOT NULL,
    transaction_time TEXT,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'four_walls', 'transfer')),
    is_four_walls INTEGER DEFAULT 0,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (pay_period_id) REFERENCES pay_periods(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_period ON transactions(pay_period_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);

-- Per Diem Tracking Table
CREATE TABLE IF NOT EXISTS per_diem_tracking (
    id TEXT PRIMARY KEY,
    pay_period_id TEXT NOT NULL,
    tracking_date TEXT NOT NULL,
    per_diem_amount REAL NOT NULL,
    remaining_amount REAL NOT NULL,
    spent_today REAL DEFAULT 0,
    rollover_from_previous REAL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (pay_period_id) REFERENCES pay_periods(id),
    UNIQUE(pay_period_id, tracking_date)
);

CREATE INDEX IF NOT EXISTS idx_per_diem_period_date ON per_diem_tracking(pay_period_id, tracking_date);

-- Settings Table
CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, key)
);

CREATE INDEX IF NOT EXISTS idx_settings_user ON settings(user_id);

-- Receipts Table (Optional)
CREATE TABLE IF NOT EXISTS receipts (
    id TEXT PRIMARY KEY,
    transaction_id TEXT,
    image_path TEXT,
    extracted_amount REAL,
    extracted_merchant TEXT,
    extracted_date TEXT,
    ocr_confidence REAL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (transaction_id) REFERENCES transactions(id)
);

-- User Goals Table
CREATE TABLE IF NOT EXISTS user_goals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    goal_text TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_user_goals_user ON user_goals(user_id);
`;

// ============================================
// Default Categories
// ============================================

export const DEFAULT_CATEGORIES = [
  // Predictable Expenses
  { name: 'Housing', type: 'predictable_expenses' },
  { name: 'Utilities', type: 'predictable_expenses' },
  { name: 'Debt', type: 'predictable_expenses' },
  { name: 'Savings', type: 'predictable_expenses' },
  // Discretionary
  { name: 'Dining', type: 'discretionary' },
  { name: 'Transportation', type: 'discretionary' },
  { name: 'Coffee', type: 'discretionary' },
  { name: 'Shopping', type: 'discretionary' },
  { name: 'Entertainment', type: 'discretionary' },
  { name: 'Subscriptions', type: 'discretionary' },
  { name: 'Health', type: 'discretionary' },
  { name: 'Personal', type: 'discretionary' },
  { name: 'Kids/Family', type: 'discretionary' },
  { name: 'Pets', type: 'discretionary' },
  { name: 'Gifts', type: 'discretionary' },
  { name: 'Travel', type: 'discretionary' },
  { name: 'Misc', type: 'discretionary' },
];

export const INSERT_DEFAULT_CATEGORIES_SQL = DEFAULT_CATEGORIES.map(
  (cat) => `
    INSERT OR IGNORE INTO categories (id, name, type, is_default, is_active)
    VALUES ('${generateUUID()}', '${cat.name}', '${cat.type}', 1, 1);
  `
).join('\n');
