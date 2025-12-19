// Spend & Send - Data Service
//
// This service provides all CRUD operations for the app.
// It abstracts the database layer, making it easy to swap
// SQLite for a backend API later.

import { database } from './database';
import { generateUUID } from './schema';
import {
  User,
  PayPeriod,
  FourWallsAllocation,
  Category,
  Transaction,
  PerDiemTracking,
  Setting,
  PeriodSummary,
  FourWallsCategory,
} from '../types';

// ============================================
// User Operations
// ============================================

export const UserService = {
  async getCurrentUser(): Promise<User | null> {
    const result = await database.executeSql('SELECT * FROM users LIMIT 1');
    return result.rows[0] || null;
  },

  async createUser(email?: string, name?: string, currency: string = 'USD'): Promise<User> {
    const id = generateUUID();
    await database.executeSql(
      'INSERT INTO users (id, email, name, currency) VALUES (?, ?, ?, ?)',
      [id, email, name, currency]
    );
    return { id, email, name, currency, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  },

  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    const values = [...Object.values(updates), id];
    await database.executeSql(
      `UPDATE users SET ${fields}, updated_at = datetime('now') WHERE id = ?`,
      values
    );
  },
};

// ============================================
// Pay Period Operations
// ============================================

export const PayPeriodService = {
  async getActivePayPeriod(userId: string): Promise<PayPeriod | null> {
    const result = await database.executeSql(
      'SELECT * FROM pay_periods WHERE user_id = ? AND is_active = 1 ORDER BY start_date DESC LIMIT 1',
      [userId]
    );
    return result.rows[0] || null;
  },

  async getAllPayPeriods(userId: string): Promise<PayPeriod[]> {
    const result = await database.executeSql(
      'SELECT * FROM pay_periods WHERE user_id = ? ORDER BY start_date DESC',
      [userId]
    );
    return result.rows;
  },

  async createPayPeriod(
    userId: string,
    startDate: string,
    endDate: string,
    incomeAmount: number,
    fourWallsTotal: number
  ): Promise<PayPeriod> {
    // Deactivate previous pay periods
    await database.executeSql(
      'UPDATE pay_periods SET is_active = 0 WHERE user_id = ?',
      [userId]
    );

    const id = generateUUID();
    const discretionaryPool = incomeAmount - fourWallsTotal;
    const daysUntilPayday = Math.ceil(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    const perDiem = discretionaryPool / daysUntilPayday;

    await database.executeSql(
      `INSERT INTO pay_periods 
       (id, user_id, start_date, end_date, income_amount, four_walls_total, discretionary_pool, per_diem, days_until_payday, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [id, userId, startDate, endDate, incomeAmount, fourWallsTotal, discretionaryPool, perDiem, daysUntilPayday]
    );

    return {
      id,
      user_id: userId,
      start_date: startDate,
      end_date: endDate,
      income_amount: incomeAmount,
      four_walls_total: fourWallsTotal,
      discretionary_pool: discretionaryPool,
      per_diem: perDiem,
      days_until_payday: daysUntilPayday,
      is_active: true,
      created_at: new Date().toISOString(),
    };
  },

  async updatePayPeriod(id: string, updates: Partial<PayPeriod>): Promise<void> {
    const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    const values = [...Object.values(updates), id];
    await database.executeSql(`UPDATE pay_periods SET ${fields} WHERE id = ?`, values);
  },
};

// ============================================
// Four Walls Allocations
// ============================================

export const FourWallsService = {
  async getAllocations(payPeriodId: string): Promise<FourWallsAllocation[]> {
    const result = await database.executeSql(
      'SELECT * FROM four_walls_allocations WHERE pay_period_id = ? ORDER BY category',
      [payPeriodId]
    );
    return result.rows;
  },

  async createAllocation(
    payPeriodId: string,
    category: FourWallsCategory,
    allocatedAmount: number
  ): Promise<FourWallsAllocation> {
    const id = generateUUID();
    await database.executeSql(
      'INSERT INTO four_walls_allocations (id, pay_period_id, category, allocated_amount) VALUES (?, ?, ?, ?)',
      [id, payPeriodId, category, allocatedAmount]
    );
    return {
      id,
      pay_period_id: payPeriodId,
      category,
      allocated_amount: allocatedAmount,
      spent_amount: 0,
      created_at: new Date().toISOString(),
    };
  },

  async updateSpentAmount(id: string, spentAmount: number): Promise<void> {
    await database.executeSql(
      'UPDATE four_walls_allocations SET spent_amount = ? WHERE id = ?',
      [spentAmount, id]
    );
  },

  async addToSpentAmount(payPeriodId: string, category: string, amount: number): Promise<void> {
    await database.executeSql(
      'UPDATE four_walls_allocations SET spent_amount = spent_amount + ? WHERE pay_period_id = ? AND category = ?',
      [amount, payPeriodId, category]
    );
  },
};

// ============================================
// Category Operations
// ============================================

export const CategoryService = {
  async getAllCategories(): Promise<Category[]> {
    const result = await database.executeSql(
      'SELECT * FROM categories WHERE is_active = 1 ORDER BY type, name'
    );
    return result.rows;
  },

  async getCategoriesByType(type: 'four_walls' | 'discretionary'): Promise<Category[]> {
    const result = await database.executeSql(
      'SELECT * FROM categories WHERE type = ? AND is_active = 1 ORDER BY name',
      [type]
    );
    return result.rows;
  },

  async getCategoryByName(name: string): Promise<Category | null> {
    const result = await database.executeSql(
      'SELECT * FROM categories WHERE LOWER(name) = LOWER(?) AND is_active = 1 LIMIT 1',
      [name]
    );
    return result.rows[0] || null;
  },

  async createCategory(
    name: string,
    type: 'four_walls' | 'discretionary',
    userId?: string
  ): Promise<Category> {
    const id = generateUUID();
    await database.executeSql(
      'INSERT INTO categories (id, user_id, name, type, is_default, is_active) VALUES (?, ?, ?, ?, 0, 1)',
      [id, userId, name, type]
    );
    return {
      id,
      user_id: userId,
      name,
      type,
      is_default: false,
      is_active: true,
      created_at: new Date().toISOString(),
    };
  },
};

// ============================================
// Transaction Operations
// ============================================

export const TransactionService = {
  async getTransactionsByPeriod(payPeriodId: string): Promise<Transaction[]> {
    const result = await database.executeSql(
      `SELECT t.*, c.name as category_name, c.type as category_type
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE t.pay_period_id = ?
       ORDER BY t.transaction_date DESC, t.transaction_time DESC`,
      [payPeriodId]
    );
    return result.rows;
  },

  async getTransactionsByDate(userId: string, date: string): Promise<Transaction[]> {
    const result = await database.executeSql(
      'SELECT * FROM transactions WHERE user_id = ? AND transaction_date = ? ORDER BY transaction_time DESC',
      [userId, date]
    );
    return result.rows;
  },

  async getRecentTransactions(userId: string, limit: number = 20): Promise<Transaction[]> {
    const result = await database.executeSql(
      `SELECT t.*, c.name as category_name, c.type as category_type
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = ?
       ORDER BY t.transaction_date DESC, t.transaction_time DESC
       LIMIT ?`,
      [userId, limit]
    );
    return result.rows;
  },

  async createTransaction(
    userId: string,
    payPeriodId: string,
    categoryId: string,
    amount: number,
    type: 'income' | 'expense' | 'four_walls' | 'transfer',
    description?: string,
    merchant?: string,
    transactionDate?: string,
    notes?: string
  ): Promise<Transaction> {
    const id = generateUUID();
    const date = transactionDate || new Date().toISOString().split('T')[0];
    const time = new Date().toISOString().split('T')[1].split('.')[0];
    const isFourWalls = type === 'four_walls' ? 1 : 0;

    await database.executeSql(
      `INSERT INTO transactions 
       (id, user_id, pay_period_id, category_id, amount, description, merchant, transaction_date, transaction_time, type, is_four_walls, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, payPeriodId, categoryId, amount, description, merchant, date, time, type, isFourWalls, notes]
    );

    return {
      id,
      user_id: userId,
      pay_period_id: payPeriodId,
      category_id: categoryId,
      amount,
      description,
      merchant,
      transaction_date: date,
      transaction_time: time,
      type,
      is_four_walls: Boolean(isFourWalls),
      notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<void> {
    const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    const values = [...Object.values(updates), id];
    await database.executeSql(
      `UPDATE transactions SET ${fields}, updated_at = datetime('now') WHERE id = ?`,
      values
    );
  },

  async deleteTransaction(id: string): Promise<void> {
    await database.executeSql('DELETE FROM transactions WHERE id = ?', [id]);
  },

  async getCategoryTotals(payPeriodId: string): Promise<{ name: string; type: string; total: number; count: number }[]> {
    const result = await database.executeSql(
      `SELECT c.name, c.type, SUM(t.amount) as total, COUNT(t.id) as count
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE t.pay_period_id = ?
       GROUP BY c.id, c.name, c.type
       ORDER BY total DESC`,
      [payPeriodId]
    );
    return result.rows;
  },

  async getDiscretionaryTotal(payPeriodId: string): Promise<number> {
    const result = await database.executeSql(
      `SELECT COALESCE(SUM(t.amount), 0) as total
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE t.pay_period_id = ? AND c.type = 'discretionary'`,
      [payPeriodId]
    );
    return result.rows[0]?.total || 0;
  },
};

// ============================================
// Per Diem Tracking
// ============================================

export const PerDiemService = {
  async getTodaysPerDiem(payPeriodId: string): Promise<PerDiemTracking | null> {
    const today = new Date().toISOString().split('T')[0];
    const result = await database.executeSql(
      'SELECT * FROM per_diem_tracking WHERE pay_period_id = ? AND tracking_date = ?',
      [payPeriodId, today]
    );
    return result.rows[0] || null;
  },

  async getPerDiemHistory(payPeriodId: string): Promise<PerDiemTracking[]> {
    const result = await database.executeSql(
      'SELECT * FROM per_diem_tracking WHERE pay_period_id = ? ORDER BY tracking_date DESC',
      [payPeriodId]
    );
    return result.rows;
  },

  async createOrUpdateTodaysPerDiem(
    payPeriodId: string,
    perDiemAmount: number,
    spentToday: number,
    rolloverFromPrevious: number = 0
  ): Promise<PerDiemTracking> {
    const today = new Date().toISOString().split('T')[0];
    const remaining = perDiemAmount + rolloverFromPrevious - spentToday;

    // Try to update first
    const updateResult = await database.executeSql(
      `UPDATE per_diem_tracking 
       SET per_diem_amount = ?, remaining_amount = ?, spent_today = ?, rollover_from_previous = ?
       WHERE pay_period_id = ? AND tracking_date = ?`,
      [perDiemAmount, remaining, spentToday, rolloverFromPrevious, payPeriodId, today]
    );

    if (updateResult.rowsAffected === 0) {
      // Insert new record
      const id = generateUUID();
      await database.executeSql(
        `INSERT INTO per_diem_tracking 
         (id, pay_period_id, tracking_date, per_diem_amount, remaining_amount, spent_today, rollover_from_previous)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, payPeriodId, today, perDiemAmount, remaining, spentToday, rolloverFromPrevious]
      );
    }

    return {
      id: generateUUID(),
      pay_period_id: payPeriodId,
      tracking_date: today,
      per_diem_amount: perDiemAmount,
      remaining_amount: remaining,
      spent_today: spentToday,
      rollover_from_previous: rolloverFromPrevious,
      created_at: new Date().toISOString(),
    };
  },

  async addSpending(payPeriodId: string, amount: number): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    await database.executeSql(
      `UPDATE per_diem_tracking 
       SET spent_today = spent_today + ?, remaining_amount = remaining_amount - ?
       WHERE pay_period_id = ? AND tracking_date = ?`,
      [amount, amount, payPeriodId, today]
    );
  },

  async getDaysUnderOverPerDiem(payPeriodId: string): Promise<{ under: number; over: number; on_target: number }> {
    const result = await database.executeSql(
      `SELECT 
         SUM(CASE WHEN spent_today < per_diem_amount THEN 1 ELSE 0 END) as under,
         SUM(CASE WHEN spent_today > per_diem_amount THEN 1 ELSE 0 END) as over,
         SUM(CASE WHEN spent_today = per_diem_amount THEN 1 ELSE 0 END) as on_target
       FROM per_diem_tracking
       WHERE pay_period_id = ?`,
      [payPeriodId]
    );
    return result.rows[0] || { under: 0, over: 0, on_target: 0 };
  },
};

// ============================================
// Settings Operations
// ============================================

export const SettingsService = {
  async getSetting(userId: string, key: string): Promise<string | null> {
    const result = await database.executeSql(
      'SELECT value FROM settings WHERE user_id = ? AND key = ?',
      [userId, key]
    );
    return result.rows[0]?.value || null;
  },

  async getAllSettings(userId: string): Promise<Record<string, string>> {
    const result = await database.executeSql(
      'SELECT key, value FROM settings WHERE user_id = ?',
      [userId]
    );
    return result.rows.reduce((acc: Record<string, string>, row: Setting) => {
      acc[row.key] = row.value;
      return acc;
    }, {});
  },

  async setSetting(userId: string, key: string, value: string): Promise<void> {
    await database.executeSql(
      `INSERT INTO settings (id, user_id, key, value) VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, key) DO UPDATE SET value = ?, updated_at = datetime('now')`,
      [generateUUID(), userId, key, value, value]
    );
  },

  async deleteSetting(userId: string, key: string): Promise<void> {
    await database.executeSql(
      'DELETE FROM settings WHERE user_id = ? AND key = ?',
      [userId, key]
    );
  },
};

// ============================================
// Summary & Analytics
// ============================================

export const AnalyticsService = {
  async getPeriodSummary(userId: string, payPeriodId: string): Promise<PeriodSummary> {
    const payPeriod = await PayPeriodService.getActivePayPeriod(userId);
    if (!payPeriod) {
      throw new Error('No active pay period found');
    }

    const categoryTotals = await TransactionService.getCategoryTotals(payPeriodId);
    const todaysPerDiem = await PerDiemService.getTodaysPerDiem(payPeriodId);
    const perDiemStats = await PerDiemService.getDaysUnderOverPerDiem(payPeriodId);

    const fourWallsBreakdown = categoryTotals
      .filter(c => c.type === 'four_walls')
      .map(c => ({ category: c.name, amount: c.total }));

    const discretionaryBreakdown = categoryTotals
      .filter(c => c.type === 'discretionary')
      .map(c => ({ category: c.name, amount: c.total }));

    return {
      income: payPeriod.income_amount,
      four_walls_total: fourWallsBreakdown.reduce((sum, c) => sum + c.amount, 0),
      four_walls_breakdown: fourWallsBreakdown,
      discretionary_total: discretionaryBreakdown.reduce((sum, c) => sum + c.amount, 0),
      discretionary_breakdown: discretionaryBreakdown,
      per_diem: payPeriod.per_diem,
      per_diem_remaining_today: todaysPerDiem?.remaining_amount || payPeriod.per_diem,
      days_until_payday: payPeriod.days_until_payday,
      days_under_per_diem: perDiemStats.under,
      days_over_per_diem: perDiemStats.over,
    };
  },
};

// ============================================
// Export All Services
// ============================================

export const DataService = {
  User: UserService,
  PayPeriod: PayPeriodService,
  FourWalls: FourWallsService,
  Category: CategoryService,
  Transaction: TransactionService,
  PerDiem: PerDiemService,
  Settings: SettingsService,
  Analytics: AnalyticsService,
};

export default DataService;
