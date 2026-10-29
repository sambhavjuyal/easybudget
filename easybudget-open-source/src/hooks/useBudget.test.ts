import { describe, expect, it } from 'vitest';
import { calculateBudget, DEFAULT_BUDGET, EMPTY_BUDGET } from './useBudget';

describe('calculateBudget', () => {
  it('splits income into bills, savings and free money', () => {
    const c = calculateBudget(DEFAULT_BUDGET);
    expect(c.totalBills).toBe(35500);
    expect(c.targetSavings).toBe(9750);
    expect(c.freeMonthlySpending).toBe(19750);
    expect(c.dailySafeSpend).toBe(658);
    expect(c.healthState).toBe('great');
  });
  it('flags a shortfall and never shows a negative daily limit', () => {
    const c = calculateBudget({ ...DEFAULT_BUDGET, income: 30000, rent: 30000 });
    expect(c.healthState).toBe('tight');
    expect(c.dailySafeSpend).toBe(0);
  });
  it('marks a thin margin as okay', () => {
    expect(calculateBudget({ ...EMPTY_BUDGET, income: 40000, rent: 30000, savingsPercent: 15 }).healthState).toBe('okay');
  });
  it('handles an empty budget without NaN', () => {
    const c = calculateBudget(EMPTY_BUDGET);
    expect(Number.isNaN(c.billsPercentage)).toBe(false);
    expect(c.dailySafeSpend).toBe(0);
  });
});
