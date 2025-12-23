// Spend & Send - Claude AI Service
//
// This service handles all interactions with the Claude API
// for parsing user input and generating responses.

import { 
  AssistantResponse, 
  ParsedTransaction, 
  PeriodSummary,
  ChartConfig 
} from '../types';

// ============================================
// Configuration
// ============================================

// Vercel proxy URL
const API_BASE_URL = 'https://spend-and-send.vercel.app/api';

// Claude model to use
const MODEL = 'claude-sonnet-4-20250514';

// ============================================
// System Prompt
// ============================================

const SYSTEM_PROMPT = `You are Spend & Send, a calm, practical budgeting assistant. Your job is to help the user track spending through short conversational messages, organize it into a simple budget, and guide them using the Spend & Send Method.

## The Spend & Send Method
- **Predictable Expenses First:** Housing, Utilities, Debt, Savings, subscriptions, bills, and any other predictable payments. These are protected and non-negotiable.
- **Discretionary Pool:** Money remaining after Predictable Expenses are funded for the pay period.
- **Per Diem:** Discretionary Pool ÷ Days until payday. If the user stays under their per diem over time, they won't hit zero.

## Core Principles
- Be non-judgmental, clear, and practical. No shame, no scolding.
- Do not connect to bank accounts or assume access to them.
- Do not give professional financial, tax, or legal advice. Provide budgeting guidance only.
- Prefer simple defaults and consistency over complexity.
- Always keep a transparent ledger: what you recorded, where it went, and why.
- When providing advice, consider the user's financial goals (if provided) and tailor guidance to help them achieve those goals.

## Response Format
Always respond with valid JSON matching this structure:
{
  "message": "Your conversational response to the user",
  "action": "log_transaction" | "update_transaction" | "show_summary" | "answer_question" | "setup_payday" | null,
  "parsed_transaction": {
    "amount": number,
    "description": "string",
    "category": "string",
    "merchant": "string or null",
    "date": "YYYY-MM-DD",
    "type": "income" | "expense" | "four_walls",
    "is_four_walls": boolean, // Note: This flag indicates if transaction is predictable expense
    "confidence": number (0-1)
  } | null,
  "insight": "Optional insight about spending patterns" | null,
  "chart_config": {
    "type": "bar" | "pie" | "line",
    "labels": ["string"],
    "data": [number],
    "title": "string"
  } | null
}

## Categorization Rules
Default categories:
- **Predictable Expenses (Four Walls):** Housing, Utilities, Transportation, Debt, Savings
- **Discretionary:** Dining, Coffee, Shopping, Entertainment, Subscriptions, Health, Personal, Kids/Family, Pets, Gifts, Travel, Misc

Rules:
- Always prefer an existing category
- Do not create "micro-categories" (e.g., "Morning Coffee", "Gas Station Snacks")
- If ambiguous, ask a quick either/or: "Dining or Shopping?"
- Map common merchants to categories (Starbucks → Coffee, McDonald's → Dining)

## Transaction Logging
When logging a transaction, respond like:
{
  "message": "Logged: $12.00 — Lunch at Chipotle — Dining\\n\\nToday: $33.00 left of $45.00",
  "action": "log_transaction",
  "parsed_transaction": { ... }
}

## When Unsure
If you can't confidently parse the input, ask for clarification in a friendly way.
Set confidence to a lower value (< 0.7) and include your best guess.`;

// ============================================
// Types
// ============================================

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface BudgetContext {
  per_diem: number;
  per_diem_remaining_today: number;
  days_until_payday: number;
  discretionary_spent_today: number;
  discretionary_spent_period: number;
  four_walls_status: { category: string; allocated: number; spent: number }[]; // Predictable Expenses status
  recent_transactions: { amount: number; description: string; category: string; date: string }[];
  user_goals?: string[]; // User's financial goals from onboarding
}

// ============================================
// Claude API Service
// ============================================

class ClaudeService {
  private conversationHistory: ClaudeMessage[] = [];
  private maxHistoryLength = 20;

  // Send a message to Claude and get a response
  async sendMessage(
    userMessage: string,
    budgetContext?: BudgetContext
  ): Promise<AssistantResponse> {
    try {
      // Build the user message with context
      const contextualMessage = this.buildContextualMessage(userMessage, budgetContext);

      // Add to conversation history
      this.conversationHistory.push({
        role: 'user',
        content: contextualMessage,
      });

      // Trim history if too long
      if (this.conversationHistory.length > this.maxHistoryLength) {
        this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
      }

      // Call Claude API
      const response = await this.callClaudeAPI();

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: response.message,
      });

      return response;
    } catch (error) {
      console.error('Claude API error:', error);
      throw error;
    }
  }

  // Build message with budget context
  private buildContextualMessage(
    userMessage: string,
    context?: BudgetContext
  ): string {
    if (!context) {
      return userMessage;
    }

    const contextString = `
[Current Budget Context]
- Per diem: $${context.per_diem.toFixed(2)}
- Today's remaining: $${context.per_diem_remaining_today.toFixed(2)}
- Days until payday: ${context.days_until_payday}
- Spent today (discretionary): $${context.discretionary_spent_today.toFixed(2)}
- Spent this period (discretionary): $${context.discretionary_spent_period.toFixed(2)}

[Predictable Expenses Status]
${context.four_walls_status.map(fw => 
  `- ${fw.category}: $${fw.spent.toFixed(2)} / $${fw.allocated.toFixed(2)}`
).join('\n')}

${context.user_goals && context.user_goals.length > 0 ? `[User Financial Goals]
${context.user_goals.map(goal => `- ${goal}`).join('\n')}
` : ''}
[Recent Transactions]
${context.recent_transactions.slice(0, 5).map(t => 
  `- $${t.amount.toFixed(2)} — ${t.description} — ${t.category} (${t.date})`
).join('\n')}

[User Message]
${userMessage}`;

    return contextString;
  }

  // Call the Claude API via Vercel proxy
  private async callClaudeAPI(): Promise<AssistantResponse> {
    try {
      console.log('Calling Claude API...');
      
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          system: SYSTEM_PROMPT,
          messages: this.conversationHistory,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error:', response.status, errorText);
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Claude response:', data);

      // Extract the text content from Claude's response
      const rawTextContent = data.content?.[0]?.text;
      
      if (!rawTextContent) {
        throw new Error('No text content in response');
      }

      const textContent = this.stripCodeFences(rawTextContent.trim());

      // Try to parse as JSON (structured response); fall back to plain text if parsing fails.
      const parsed = this.tryParseJson(textContent);

      return {
        message: parsed?.message || textContent,
        action: parsed?.action || undefined,
        parsed_transaction: parsed?.parsed_transaction || undefined,
        insight: parsed?.insight || undefined,
        chart_config: parsed?.chart_config || undefined,
      };
    } catch (error) {
      console.error('Claude API call failed:', error);
      // Return a friendly error message
      return {
        message: "I'm having trouble connecting right now. Please try again in a moment.",
        action: undefined,
        parsed_transaction: undefined,
        insight: undefined,
        chart_config: undefined,
      };
    }
  }

  // Parse a single transaction input (simplified call)
  async parseTransaction(input: string): Promise<ParsedTransaction | null> {
    const response = await this.sendMessage(input);
    return response.parsed_transaction || null;
  }

  // Ask a question about spending patterns
  async askQuestion(
    question: string,
    context: BudgetContext
  ): Promise<AssistantResponse> {
    return this.sendMessage(question, context);
  }

  // Generate a spending summary
  async generateSummary(
    summary: PeriodSummary
  ): Promise<AssistantResponse> {
    const summaryMessage = `Generate a summary of my current pay period:
    
Income: $${summary.income}
Predictable Expenses Total: $${summary.four_walls_total}
Discretionary Spent: $${summary.discretionary_spent}
Per Diem: $${summary.per_diem}
Remaining Today: $${summary.per_diem_remaining_today}
Days Until Payday: ${summary.days_until_payday}
Days Under Per Diem: ${summary.days_under_per_diem}
Days Over Per Diem: ${summary.days_over_per_diem}

Top Categories:
${summary.discretionary_breakdown.slice(0, 5).map(c => 
  `- ${c.category}: $${c.amount}`
).join('\n')}`;

    return this.sendMessage(summaryMessage);
  }

  // Get spending insight for a category
  async getCategoryInsight(
    category: string,
    currentAmount: number,
    previousAmount: number,
    periodDays: number
  ): Promise<string> {
    const response = await this.sendMessage(
      `Analyze my ${category} spending: $${currentAmount} this period vs $${previousAmount} last period over ${periodDays} days. Is this concerning?`
    );
    return response.insight || response.message;
  }

  // Clear conversation history
  clearHistory(): void {
    this.conversationHistory = [];
  }

  // Get current conversation history
  getHistory(): ClaudeMessage[] {
    return [...this.conversationHistory];
  }

  // Remove leading/trailing code fences (e.g., ```json ... ```) to avoid rendering JSON blocks
  private stripCodeFences(text: string): string {
    if (text.startsWith('```')) {
      // Remove leading fence and optional language
      const withoutLeading = text.replace(/^```[a-zA-Z]*\n?/, '');
      // Remove trailing fence
      const withoutTrailing = withoutLeading.replace(/```$/, '');
      return withoutTrailing.trim();
    }
    return text;
  }

  // Safely attempt JSON parsing; return null if it fails
  private tryParseJson(text: string): any | null {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }
}

// ============================================
// Vercel Proxy API Template
// ============================================

/*
Create this file in your Vercel project: /api/chat.ts

import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { model, system, messages, max_tokens } = await request.json();

    const response = await anthropic.messages.create({
      model: model || 'claude-sonnet-4-20250514',
      max_tokens: max_tokens || 1024,
      system: system,
      messages: messages,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Claude API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
*/

// ============================================
// Export
// ============================================

export const claudeService = new ClaudeService();
export default claudeService;

