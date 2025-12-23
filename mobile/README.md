# Spend & Send - Mobile App

A calm budgeting companion built with React Native and Expo.

## Project Structure

```
mobile/
├── src/
│   ├── database/           # SQLite database layer
│   │   ├── schema.ts       # Table definitions and SQL
│   │   ├── database.ts     # Database initialization
│   │   ├── dataService.ts  # CRUD operations
│   │   └── index.ts        # Module exports
│   │
│   ├── services/           # Business logic
│   │   ├── claudeService.ts   # Claude AI integration
│   │   ├── budgetService.ts   # Budget operations
│   │   └── index.ts           # Module exports
│   │
│   ├── types/              # TypeScript types
│   │   └── index.ts        # All type definitions
│   │
│   ├── components/         # UI components (TODO)
│   ├── screens/            # App screens (TODO)
│   └── utils/              # Utility functions (TODO)
│
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
└── README.md               # This file
```

## Setup

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Configure Claude API

Update `src/services/claudeService.ts` with your Vercel proxy URL:

```typescript
const API_BASE_URL = 'https://your-vercel-proxy.vercel.app/api';
```

### 3. Run the App

```bash
# Start Expo dev server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Architecture

### Database Layer

The app uses SQLite for local storage. Key services:

- **UserService** - User management
- **PayPeriodService** - Pay period tracking
- **TransactionService** - Transaction CRUD
- **PerDiemService** - Per diem calculations
- **CategoryService** - Category management
- **FourWallsService** - Four Walls allocations
- **SettingsService** - User preferences
- **AnalyticsService** - Summaries and insights

### AI Layer

Claude AI handles:
- Natural language transaction parsing
- Spending analysis and insights
- Conversational Q&A

### Budget Service

The `budgetService` coordinates between database and AI:
- Processes user messages
- Logs transactions
- Calculates per diem
- Generates summaries

## Usage Examples

### Initialize the App

```typescript
import { database } from './src/database';
import { budgetService } from './src/services';

// Initialize database
await database.initialize();

// Initialize budget service
await budgetService.initialize();
```

### Process a Message

```typescript
const response = await budgetService.processMessage("I spent $12 on lunch");
console.log(response.message);
// "Logged: $12.00 — Lunch — Dining\n\nToday: $33.00 left of $45.00"
```

### Get Today's Status

```typescript
const status = await budgetService.getTodaysStatus();
console.log(`Remaining: $${status.remaining}`);
```

### Log Income / Payday

```typescript
await budgetService.logIncome(2400, '2024-02-15', [
  { category: 'Housing', amount: 1200 },
  { category: 'Utilities', amount: 150 },
  { category: 'Groceries', amount: 300 },
  { category: 'Transportation', amount: 150 },
  { category: 'Savings', amount: 200 },
]);
```

## Next Steps

1. **Set up Expo project** - Run `npx create-expo-app` and merge with this structure
2. **Build screens** - Implement wireframes from `mobile-wireframes.md`
3. **Connect Claude** - Deploy Vercel proxy and update URL
4. **Add charts** - Implement using `react-native-chart-kit`
5. **Style the app** - Create a calm, focused UI

## Dependencies

- **expo-sqlite** - SQLite database
- **zustand** - State management
- **react-navigation** - Navigation
- **react-native-chart-kit** - Charts
- **date-fns** - Date utilities

