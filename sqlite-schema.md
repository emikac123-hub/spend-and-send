# Spend & Send — SQLite Database Schema

## Phase 1: Local-Only Storage

### Core Tables

#### 1. `users`
Single user per device (or multi-user support if needed later)

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    name TEXT,
    currency TEXT DEFAULT 'USD',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. `pay_periods`
Tracks each pay period with start/end dates and income

```sql
CREATE TABLE pay_periods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    income_amount DECIMAL(10, 2) NOT NULL,
    four_walls_total DECIMAL(10, 2) NOT NULL,
    discretionary_pool DECIMAL(10, 2) NOT NULL,
    per_diem DECIMAL(10, 2) NOT NULL,
    days_until_payday INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_pay_periods_user_active ON pay_periods(user_id, is_active);
CREATE INDEX idx_pay_periods_dates ON pay_periods(start_date, end_date);
```

#### 3. `four_walls_allocations`
Tracks Four Walls funding for each pay period

```sql
CREATE TABLE four_walls_allocations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pay_period_id INTEGER NOT NULL,
    category TEXT NOT NULL, -- 'Housing', 'Utilities', 'Groceries', etc.
    allocated_amount DECIMAL(10, 2) NOT NULL,
    spent_amount DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pay_period_id) REFERENCES pay_periods(id)
);

CREATE INDEX idx_four_walls_period ON four_walls_allocations(pay_period_id);
```

#### 4. `categories`
Default categories + any user-created ones

```sql
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'four_walls' or 'discretionary'
    is_default BOOLEAN DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_categories_user ON categories(user_id, is_active);
CREATE INDEX idx_categories_type ON categories(type);
```

#### 5. `transactions`
Core transaction ledger

```sql
CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    pay_period_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    merchant TEXT,
    transaction_date DATE NOT NULL,
    transaction_time TIME,
    type TEXT NOT NULL, -- 'income', 'expense', 'four_walls', 'transfer'
    is_four_walls BOOLEAN DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (pay_period_id) REFERENCES pay_periods(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_period ON transactions(pay_period_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_category ON transactions(category_id);
```

#### 6. `per_diem_tracking`
Daily per diem remaining amounts

```sql
CREATE TABLE per_diem_tracking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pay_period_id INTEGER NOT NULL,
    tracking_date DATE NOT NULL,
    per_diem_amount DECIMAL(10, 2) NOT NULL,
    remaining_amount DECIMAL(10, 2) NOT NULL,
    spent_today DECIMAL(10, 2) DEFAULT 0,
    rollover_from_previous DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pay_period_id) REFERENCES pay_periods(id),
    UNIQUE(pay_period_id, tracking_date)
);

CREATE INDEX idx_per_diem_period_date ON per_diem_tracking(pay_period_id, tracking_date);
```

#### 7. `settings`
User preferences and configuration

```sql
CREATE TABLE settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    key TEXT NOT NULL,
    value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, key)
);

CREATE INDEX idx_settings_user ON settings(user_id);
```

**Common settings keys:**
- `pay_schedule` (e.g., "bi-weekly", "monthly")
- `next_payday_date`
- `variable_income_mode` (boolean)
- `safety_buffer_amount`
- `default_four_walls_housing`
- `default_four_walls_utilities`
- etc.

#### 8. `receipts` (Optional - for OCR feature)
Store receipt images/metadata if implementing OCR

```sql
CREATE TABLE receipts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER,
    image_path TEXT,
    extracted_amount DECIMAL(10, 2),
    extracted_merchant TEXT,
    extracted_date DATE,
    ocr_confidence DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id)
);
```

---

## Default Data Setup

### Default Categories

```sql
-- Four Walls Categories
INSERT INTO categories (name, type, is_default) VALUES
('Housing', 'four_walls', 1),
('Utilities', 'four_walls', 1),
('Groceries', 'four_walls', 1),
('Transportation', 'four_walls', 1),
('Debt', 'four_walls', 1),
('Savings', 'four_walls', 1);

-- Discretionary Categories
INSERT INTO categories (name, type, is_default) VALUES
('Dining', 'discretionary', 1),
('Coffee', 'discretionary', 1),
('Shopping', 'discretionary', 1),
('Entertainment', 'discretionary', 1),
('Subscriptions', 'discretionary', 1),
('Health', 'discretionary', 1),
('Personal', 'discretionary', 1),
('Kids/Family', 'discretionary', 1),
('Pets', 'discretionary', 1),
('Gifts', 'discretionary', 1),
('Travel', 'discretionary', 1),
('Misc', 'discretionary', 1);
```

---

## Key Queries You'll Need

### Get Active Pay Period
```sql
SELECT * FROM pay_periods 
WHERE user_id = ? AND is_active = 1 
ORDER BY start_date DESC 
LIMIT 1;
```

### Get Today's Per Diem
```sql
SELECT * FROM per_diem_tracking 
WHERE pay_period_id = ? AND tracking_date = DATE('now')
ORDER BY tracking_date DESC 
LIMIT 1;
```

### Get Period Transactions
```sql
SELECT t.*, c.name as category_name, c.type as category_type
FROM transactions t
JOIN categories c ON t.category_id = c.id
WHERE t.pay_period_id = ?
ORDER BY t.transaction_date DESC, t.transaction_time DESC;
```

### Get Category Totals for Period
```sql
SELECT 
    c.name,
    c.type,
    SUM(t.amount) as total_spent,
    COUNT(t.id) as transaction_count
FROM transactions t
JOIN categories c ON t.category_id = c.id
WHERE t.pay_period_id = ?
GROUP BY c.id, c.name, c.type
ORDER BY total_spent DESC;
```

### Get Four Walls Status
```sql
SELECT 
    fwa.category,
    fwa.allocated_amount,
    fwa.spent_amount,
    (fwa.allocated_amount - fwa.spent_amount) as remaining
FROM four_walls_allocations fwa
WHERE fwa.pay_period_id = ?
ORDER BY fwa.category;
```

### Calculate Discretionary Spending
```sql
SELECT 
    COALESCE(SUM(t.amount), 0) as discretionary_spent
FROM transactions t
JOIN categories c ON t.category_id = c.id
WHERE t.pay_period_id = ? 
  AND c.type = 'discretionary'
  AND t.is_four_walls = 0;
```

---

## Migration Strategy

### Version 1.0.0 (Initial Schema)
- All tables above
- Default categories
- Basic indexes

### Future Migrations
- Add `transaction_tags` table if needed
- Add `budget_goals` table for savings targets
- Add `recurring_transactions` for subscriptions
- Add `export_history` for CSV tracking

---

## React Native Implementation Notes

### Library: `react-native-sqlite-storage` or `expo-sqlite`

```javascript
// Example initialization
import SQLite from 'react-native-sqlite-storage';

const db = SQLite.openDatabase(
  { name: 'spendandsend.db', location: 'default' },
  () => console.log('Database opened'),
  (error) => console.error('Database error', error)
);
```

### Key Operations
1. **Initialize database** on app start
2. **Create tables** if they don't exist
3. **Insert default categories** on first run
4. **Transaction logging** (INSERT with category matching)
5. **Per diem calculation** (triggered on transaction insert)
6. **Period summaries** (aggregation queries)

---

## Data Integrity Considerations

1. **Foreign Keys**: Enable in SQLite (`PRAGMA foreign_keys = ON;`)
2. **Transactions**: Use SQLite transactions for atomic operations
3. **Constraints**: Add CHECK constraints for valid amounts, dates
4. **Triggers**: Consider triggers for auto-updating `updated_at` timestamps
5. **Backup**: Regular SQLite backup to user's filesystem (for CSV export)

---

## Performance Optimizations

1. **Indexes**: Already included on frequently queried columns
2. **Query Optimization**: Use EXPLAIN QUERY PLAN for slow queries
3. **Batch Operations**: Use transactions for multiple inserts
4. **Lazy Loading**: Load transactions in pages (LIMIT/OFFSET)
5. **Caching**: Cache active pay period and today's per diem in app state
