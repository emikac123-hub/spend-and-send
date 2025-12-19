// Spend & Send - Database Initialization
// 
// This file handles SQLite database initialization and provides
// the database instance to the rest of the app.
//
// For React Native, use: react-native-sqlite-storage or expo-sqlite
// For Expo: expo-sqlite

import { CREATE_TABLES_SQL, DEFAULT_CATEGORIES, generateUUID } from './schema';

// ============================================
// Database Configuration
// ============================================

const DATABASE_NAME = 'spendandsend.db';
const DATABASE_VERSION = 1;

// ============================================
// Database Instance (Placeholder)
// 
// Replace with actual SQLite implementation:
// - React Native CLI: react-native-sqlite-storage
// - Expo: expo-sqlite
// ============================================

// Example with expo-sqlite:
// import * as SQLite from 'expo-sqlite';
// const db = SQLite.openDatabase(DATABASE_NAME);

// Example with react-native-sqlite-storage:
// import SQLite from 'react-native-sqlite-storage';
// SQLite.enablePromise(true);
// const db = await SQLite.openDatabase({ name: DATABASE_NAME, location: 'default' });

// Placeholder interface for database operations
interface DatabaseResult {
  rows: any[];
  rowsAffected: number;
  insertId?: string;
}

// ============================================
// Database Class
// ============================================

class Database {
  private db: any = null;
  private isInitialized: boolean = false;

  // Initialize the database
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // TODO: Replace with actual SQLite initialization
      // this.db = await SQLite.openDatabase({ name: DATABASE_NAME, location: 'default' });
      
      console.log('Initializing database...');
      
      // Create tables
      await this.executeSql(CREATE_TABLES_SQL);
      
      // Insert default categories if not exists
      await this.seedDefaultCategories();
      
      this.isInitialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  // Execute raw SQL
  async executeSql(sql: string, params: any[] = []): Promise<DatabaseResult> {
    // TODO: Replace with actual SQLite execution
    // return new Promise((resolve, reject) => {
    //   this.db.transaction((tx) => {
    //     tx.executeSql(
    //       sql,
    //       params,
    //       (_, result) => resolve({ rows: result.rows._array, rowsAffected: result.rowsAffected }),
    //       (_, error) => { reject(error); return false; }
    //     );
    //   });
    // });

    console.log('Executing SQL:', sql.substring(0, 100) + '...');
    console.log('Params:', params);
    
    // Placeholder return
    return { rows: [], rowsAffected: 0 };
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
    const existingCategories = await this.executeSql(
      'SELECT COUNT(*) as count FROM categories WHERE is_default = 1'
    );
    
    // Only seed if no default categories exist
    if (existingCategories.rows[0]?.count === 0) {
      console.log('Seeding default categories...');
      
      for (const category of DEFAULT_CATEGORIES) {
        await this.executeSql(
          'INSERT INTO categories (id, name, type, is_default, is_active) VALUES (?, ?, ?, 1, 1)',
          [generateUUID(), category.name, category.type]
        );
      }
      
      console.log('Default categories seeded');
    }
  }

  // Create default user if not exists
  async ensureDefaultUser(): Promise<string> {
    const users = await this.executeSql('SELECT id FROM users LIMIT 1');
    
    if (users.rows.length === 0) {
      const userId = generateUUID();
      await this.executeSql(
        'INSERT INTO users (id, currency) VALUES (?, ?)',
        [userId, 'USD']
      );
      console.log('Default user created:', userId);
      return userId;
    }
    
    return users.rows[0].id;
  }

  // Get database instance
  getDb(): any {
    if (!this.isInitialized) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  // Close database connection
  async close(): Promise<void> {
    if (this.db) {
      // await this.db.close();
      this.db = null;
      this.isInitialized = false;
      console.log('Database connection closed');
    }
  }
}

// Export singleton instance
export const database = new Database();
export default database;
