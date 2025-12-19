// Spend & Send - Budget Service
//
// This service coordinates between the database and Claude AI
// to handle all budgeting operations.

import DataService from '../database/dataService';
import claudeService from './claudeService';
import {
  Transaction,
  PayPeriod,
  PeriodSummary,
  AssistantResponse,
  ParsedTransaction,
} from '../types';

// ============================================
// Budget Service
// ============================================

class BudgetService {
  private currentUserId: string | null = null;
  private currentPayPeriodId: string | null = null;

  // Initialize the service with user context
  async initialize(): Promise<void> {
    const user = await DataService.User.getCurrentUser();
    if (user) {
      this.currentUserId = user.id;
      const payPeriod = await DataService.PayPeriod.getActivePayPeriod(user.id);
      if (payPeriod) {
        this.currentPayPeriodId = payPeriod.id;
      }
    }
  }

  // Get current user ID
  getUserId(): string {
    if (!this.currentUserId) {
      throw new Error('User not initialized. Call initialize() first.');
    }
    return this.currentUserId;
  }

  // Get current pay period ID
  getPayPeriodId(): string {
    if (!this.currentPayPeriodId) {
      throw new Error('No active pay period. Set up a pay period first.');
    }
    return this.currentPayPeriodId;
  }

  // ============================================
  // Chat / Conversation
  // ============================================

  // Process user message (main entry point for chat)
  async processMessage(userMessage: string): Promise<AssistantResponse> {
    // Get current budget context
    const context = await this.getBudgetContext();

    // Send to Claude
    const response = await claudeService.sendMessage(userMessage, context);

    // Handle action if present
    if (response.action && response.parsed_transaction) {
      await this.handleAction(response.action, response.parsed_transaction);
    }

    return response;
  }

  // Get current budget context for Claude
  private async getBudgetContext() {
    try {
      const userId = this.getUserId();
      const payPeriodId = this.getPayPeriodId();

      const payPeriod = await DataService.PayPeriod.getActivePayPeriod(userId);
      if (!payPeriod) {
        return undefined;
      }

      const todaysPerDiem = await DataService.PerDiem.getTodaysPerDiem(payPeriodId);
      const fourWalls = await DataService.FourWalls.getAllocations(payPeriodId);
      const recentTransactions = await DataService.Transaction.getRecentTransactions(userId, 10);

      // Calculate today's discretionary spending
      const today = new Date().toISOString().split('T')[0];
      const todaysTransactions = await DataService.Transaction.getTransactionsByDate(userId, today);
      const discretionarySpentToday = todaysTransactions
        .filter(t => !t.is_four_walls)
        .reduce((sum, t) => sum + t.amount, 0);

      // Calculate period discretionary spending
      const discretionarySpentPeriod = await DataService.Transaction.getDiscretionaryTotal(payPeriodId);

      return {
        per_diem: payPeriod.per_diem,
        per_diem_remaining_today: todaysPerDiem?.remaining_amount || payPeriod.per_diem,
        days_until_payday: payPeriod.days_until_payday,
        discretionary_spent_today: discretionarySpentToday,
        discretionary_spent_period: discretionarySpentPeriod,
        four_walls_status: fourWalls.map(fw => ({
          category: fw.category,
          allocated: fw.allocated_amount,
          spent: fw.spent_amount,
        })),
        recent_transactions: recentTransactions.map(t => ({
          amount: t.amount,
          description: t.description || '',
          category: (t as any).category_name || '',
          date: t.transaction_date,
        })),
      };
    } catch (error) {
      console.error('Error getting budget context:', error);
      return undefined;
    }
  }

  // Handle parsed action from Claude
  private async handleAction(
    action: string,
    parsedTransaction: ParsedTransaction
  ): Promise<void> {
    switch (action) {
      case 'log_transaction':
        await this.logTransaction(parsedTransaction);
        break;
      case 'update_transaction':
        // TODO: Implement transaction updates
        console.log('Update transaction:', parsedTransaction);
        break;
      default:
        console.log('Unhandled action:', action);
    }
  }

  // ============================================
  // Transaction Management
  // ============================================

  // Log a new transaction from parsed data
  async logTransaction(parsed: ParsedTransaction): Promise<Transaction> {
    const userId = this.getUserId();
    const payPeriodId = this.getPayPeriodId();

    // Find or create category
    let category = await DataService.Category.getCategoryByName(parsed.category);
    if (!category) {
      // Create new category (discretionary by default)
      category = await DataService.Category.createCategory(
        parsed.category,
        parsed.is_four_walls ? 'four_walls' : 'discretionary',
        userId
      );
    }

    // Create transaction
    const transaction = await DataService.Transaction.createTransaction(
      userId,
      payPeriodId,
      category.id,
      parsed.amount,
      parsed.type,
      parsed.description,
      parsed.merchant,
      parsed.date
    );

    // Update per diem if discretionary
    if (!parsed.is_four_walls) {
      await DataService.PerDiem.addSpending(payPeriodId, parsed.amount);
    }

    // Update Four Walls spent if applicable
    if (parsed.is_four_walls) {
      await DataService.FourWalls.addToSpentAmount(
        payPeriodId,
        parsed.category,
        parsed.amount
      );
    }

    return transaction;
  }

  // Log income / payday
  async logIncome(
    amount: number,
    nextPayday: string,
    fourWallsAllocations: { category: string; amount: number }[]
  ): Promise<PayPeriod> {
    const userId = this.getUserId();

    // Calculate totals
    const fourWallsTotal = fourWallsAllocations.reduce((sum, fw) => sum + fw.amount, 0);

    // Create new pay period
    const today = new Date().toISOString().split('T')[0];
    const payPeriod = await DataService.PayPeriod.createPayPeriod(
      userId,
      today,
      nextPayday,
      amount,
      fourWallsTotal
    );

    // Create Four Walls allocations
    for (const allocation of fourWallsAllocations) {
      await DataService.FourWalls.createAllocation(
        payPeriod.id,
        allocation.category as any,
        allocation.amount
      );
    }

    // Initialize today's per diem
    await DataService.PerDiem.createOrUpdateTodaysPerDiem(
      payPeriod.id,
      payPeriod.per_diem,
      0,
      0
    );

    // Update current pay period ID
    this.currentPayPeriodId = payPeriod.id;

    return payPeriod;
  }

  // ============================================
  // Queries & Summaries
  // ============================================

  // Get period summary
  async getPeriodSummary(): Promise<PeriodSummary> {
    const userId = this.getUserId();
    const payPeriodId = this.getPayPeriodId();
    return DataService.Analytics.getPeriodSummary(userId, payPeriodId);
  }

  // Get today's per diem status
  async getTodaysStatus(): Promise<{
    perDiem: number;
    remaining: number;
    spentToday: number;
    daysUntilPayday: number;
  }> {
    const payPeriodId = this.getPayPeriodId();
    const userId = this.getUserId();

    const payPeriod = await DataService.PayPeriod.getActivePayPeriod(userId);
    const todaysPerDiem = await DataService.PerDiem.getTodaysPerDiem(payPeriodId);

    return {
      perDiem: payPeriod?.per_diem || 0,
      remaining: todaysPerDiem?.remaining_amount || payPeriod?.per_diem || 0,
      spentToday: todaysPerDiem?.spent_today || 0,
      daysUntilPayday: payPeriod?.days_until_payday || 0,
    };
  }

  // Get recent transactions
  async getRecentTransactions(limit: number = 20): Promise<Transaction[]> {
    const userId = this.getUserId();
    return DataService.Transaction.getRecentTransactions(userId, limit);
  }

  // Get category totals for current period
  async getCategoryTotals(): Promise<{ name: string; type: string; total: number; count: number }[]> {
    const payPeriodId = this.getPayPeriodId();
    return DataService.Transaction.getCategoryTotals(payPeriodId);
  }

  // ============================================
  // Reflective Questions
  // ============================================

  // Ask a reflective question about spending
  async askReflectiveQuestion(question: string): Promise<AssistantResponse> {
    return this.processMessage(question);
  }

  // Get insight about a specific category
  async getCategoryInsight(category: string): Promise<string> {
    const payPeriodId = this.getPayPeriodId();
    const totals = await DataService.Transaction.getCategoryTotals(payPeriodId);
    const categoryTotal = totals.find(t => t.name === category);

    if (!categoryTotal) {
      return `You haven't spent anything on ${category} this period.`;
    }

    // TODO: Get previous period for comparison
    const previousAmount = 0;
    const payPeriod = await DataService.PayPeriod.getActivePayPeriod(this.getUserId());

    return claudeService.getCategoryInsight(
      category,
      categoryTotal.total,
      previousAmount,
      payPeriod?.days_until_payday || 14
    );
  }

  // ============================================
  // Settings
  // ============================================

  // Update a setting
  async updateSetting(key: string, value: string): Promise<void> {
    const userId = this.getUserId();
    await DataService.Settings.setSetting(userId, key, value);
  }

  // Get a setting
  async getSetting(key: string): Promise<string | null> {
    const userId = this.getUserId();
    return DataService.Settings.getSetting(userId, key);
  }

  // Get all settings
  async getAllSettings(): Promise<Record<string, string>> {
    const userId = this.getUserId();
    return DataService.Settings.getAllSettings(userId);
  }
}

// ============================================
// Export
// ============================================

export const budgetService = new BudgetService();
export default budgetService;
