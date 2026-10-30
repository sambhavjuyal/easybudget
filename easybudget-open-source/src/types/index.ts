export interface BudgetState {
  income: number;
  city: string;
  householdSize: number;
  housing: number;
  groceries: number;
  utilities: number;
  transport: number;
  insurance: number;
  discretionary: number;
  currentSavings: number;
}

export interface CityBenchmark {
  id: string;
  name: string;
  country: string;
  costIndex: number; // 100 is baseline
  avgRent1Bed: number;
  avgGroceryMultiplier: number;
  avgUtilityBaseline: number;
  tag: string;
}

export interface InflationScenario {
  rentHike: number; // in percent e.g. 8
  groceryHike: number; // in percent e.g. 12
  utilityHike: number; // in percent e.g. 15
  transportHike: number; // in percent e.g. 10
  timeHorizonYears: number; // 1, 3, or 5
}

export interface ReceiptItem {
  name: string;
  price: number;
  category: string;
  itemType?: 'Need' | 'Want' | 'Business' | 'Shared';
  sharedPercentage?: number; // e.g. 50 for 50/50 split
}

export interface ParsedReceipt {
  merchant: string;
  date: string;
  category: string;
  totalAmount: number;
  taxAmount?: number;
  needsTotal?: number;
  wantsTotal?: number;
  items: ReceiptItem[];
  inflationInsights: string[];
}

export interface JobListing {
  id: string;
  title: string;
  company: string;
  portalName: string;
  portalUrl: string;
  payRate: string;
  estimatedMonthlyBoost: number;
  workType: 'Remote' | 'Hybrid' | 'On-Site';
  commitment: 'Part-time' | 'Contract' | 'Full-time' | 'Flexible Gig';
  description: string;
  keySkills: string[];
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface AuditReport {
  stressRating: 'Safe' | 'Moderate' | 'High' | 'Critical';
  stressScore: number;
  executiveSummary: string;
  vulnerabilities: {
    title: string;
    impact: string;
    explanation: string;
  }[];
  interventions: {
    title: string;
    monthlySavings: number;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    actionSteps: string;
  }[];
  roadmap90Day: {
    month1: string;
    month2: string;
    month3: string;
  };
  leaseNegotiationScript: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

// 1. Multi-Account Burn Rate Matrix
export interface AccountBalances {
  checking: number;
  savings: number;
  cash: number;
  creditCardDebt: number;
}

export interface BurnRateCalculation {
  dailyBurn: number;
  monthlyBurn: number;
  liquidCash: number;
  netLiquid: number;
  runwayDays: number;
  runwayMonths: number;
  runwayDepletionDate: string;
}

// 2. Fixed Cost & Insurance Tracker
export interface FixedObligation {
  id: string;
  title: string;
  category: 'Housing' | 'Debt' | 'Insurance' | 'Subscriptions';
  amount: number;
  dueDay: number;
  annualRateHike?: number;
  shopAroundAlert?: boolean;
  benchmarkSuggestion?: string;
}

// 3. Variable Cost & Micro-Leaks
export interface MicroLeak {
  id: string;
  name: string;
  unitCost: number;
  frequencyPerWeek: number;
  monthlyDrain: number;
  category: 'Delivery Fee' | 'Coffee' | 'Impulse Sub' | 'Service Fee';
  painlessAlternative: string;
}

export interface SeasonalSpike {
  month: string;
  utilitySpike: number; // percentage
  holidayBudgetDelta: number; // dollar amount
  advice: string;
}

// 4. Psychological & Micro-Wins
export interface MicroWin {
  id: string;
  title: string;
  amountSaved: number;
  category: string;
  timestamp: string;
  celebrationNote: string;
}

// 5. Debt Priority & Waterfall
export interface DebtItem {
  id: string;
  name: string;
  balance: number;
  interestRate: number; // APR %
  minimumPayment: number;
}

// 6. Habit & Streak
export interface StreakProfile {
  daysStreak: number;
  totalSaved: number;
  level: string;
  levelProgress: number;
  badges: { id: string; name: string; icon: string; unlocked: boolean }[];
}
