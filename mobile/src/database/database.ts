// Spend & Send - Database Initialization
// 
// This file handles SQLite database initialization and provides
// the database instance to the rest of the app.

import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL, DEFAULT_CATEGORIES, generateUUID } from './schema';

// ============================================
// Database Configuration
// ============================================

const DATABASE_NAME = 'spendandsend.db';

// ============================================
// Database Result Interface
// ============================================

interface DatabaseResult {
  rows: any[];
  rowsAffected: number;
  insertId?: string;
}

// ============================================
// Database Class
// ============================================

class Database {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized: boolean = false;

  // Initialize the database
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('Opening SQLite database...');
      this.db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      
      console.log('Initializing database...');
      
      // Execute all CREATE statements at once (expo-sqlite supports this)
      // Remove comments and split by semicolon
      const cleanSql = CREATE_TABLES_SQL
        .split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n');
      
      await this.db.execAsync(cleanSql);
      
      // Insert default categories if not exists
      await this.seedDefaultCategories();
      
      // Don't create default user - let onboarding handle it
      
      this.isInitialized = true;
      console.log('Database initialized successfully');
      console.log('💡 Database file: spendandsend.db');
      console.log('💡 See README.md for DBeaver connection instructions');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  // Execute raw SQL with parameters
  async executeSql(sql: string, params: any[] = []): Promise<DatabaseResult> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    try {
      // Handle SELECT queries
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        const result = await this.db.getAllAsync(sql, params);
        return {
          rows: result || [],
          rowsAffected: 0,
        };
      }

      // Handle INSERT queries
      if (sql.trim().toUpperCase().startsWith('INSERT')) {
        const result = await this.db.runAsync(sql, params);
        return {
          rows: [],
          rowsAffected: result.changes || 0,
          insertId: result.lastInsertRowId?.toString(),
        };
      }

      // Handle UPDATE/DELETE queries
      if (
        sql.trim().toUpperCase().startsWith('UPDATE') ||
        sql.trim().toUpperCase().startsWith('DELETE')
      ) {
        const result = await this.db.runAsync(sql, params);
        return {
          rows: [],
          rowsAffected: result.changes || 0,
        };
      }

      // For other queries (CREATE, DROP, etc.), use execAsync
      await this.db.execAsync(sql);
      return {
        rows: [],
        rowsAffected: 0,
      };
    } catch (error) {
      console.error('SQL Error:', sql.substring(0, 100), error);
      throw error;
    }
  }

  // Execute multiple SQL statements
  async executeMultipleSql(statements: string[]): Promise<void> {
    for (const sql of statements) {
      if (sql.trim()) {
        await this.executeSql(sql);
      }
    }
  }

  // Seed default categories
  private async seedDefaultCategories(): Promise<void> {
    try {
      const existingCategories = await this.executeSql(
        'SELECT COUNT(*) as count FROM categories WHERE is_default = 1'
      );
      
      // Only seed if no default categories exist
      const count = existingCategories.rows[0]?.count || 0;
      if (count === 0) {
        console.log('Seeding default categories...');
        
        for (const category of DEFAULT_CATEGORIES) {
          const id = generateUUID();
          const data = {
            id,
            name: category.name,
            type: category.type,
            is_default: 1,
            is_active: 1,
          };
          console.log('📝 INSERT OR IGNORE INTO categories (default):', JSON.stringify(data, null, 2));
          await this.executeSql(
            'INSERT OR IGNORE INTO categories (id, name, type, is_default, is_active) VALUES (?, ?, ?, 1, 1)',
            [id, category.name, category.type]
          );
        }
        
        console.log('Default categories seeded');
      }
    } catch (error) {
      console.error('Error seeding categories:', error);
      // Don't throw - categories might already exist
    }
  }

  // Create default user if not exists
  async ensureDefaultUser(): Promise<string> {
    try {
      const users = await this.executeSql('SELECT id FROM users LIMIT 1');
      
      if (users.rows.length === 0) {
        const userId = generateUUID();
        const data = {
          id: userId,
          currency: 'USD',
        };
        console.log('📝 INSERT INTO users (default):', JSON.stringify(data, null, 2));
        await this.executeSql(
          'INSERT INTO users (id, currency) VALUES (?, ?)',
          [userId, 'USD']
        );
        console.log('Default user created:', userId);
        return userId;
      }
      
      return users.rows[0].id;
    } catch (error) {
      console.error('Error ensuring default user:', error);
      throw error;
    }
  }

  // Get database instance
  getDb(): SQLite.SQLiteDatabase {
    if (!this.db || !this.isInitialized) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  // Close database connection
  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.isInitialized = false;
      console.log('Database connection closed');
    }
  }
}

// Export singleton instance
export const database = new Database();
export default database;

