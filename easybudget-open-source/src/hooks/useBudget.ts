import { useCallback, useEffect, useMemo, useState } from 'react';

export interface Budget {
  income: number; rent: number; food: number; utilities: number; loans: number; savingsPercent: number;
}
export const DEFAULT_BUDGET: Budget = { income: 65000, rent: 18000, food: 9000, utilities: 3500, loans: 5000, savingsPercent: 15 };
export const EMPTY_BUDGET: Budget = { income: 0, rent: 0, food: 0, utilities: 0, loans: 0, savingsPercent: 20 };
const KEY = 'easybudget:v1'; // bump when the shape changes
const ONB = 'easybudget:onboarded:v1';
// Anyone with a budget saved before the wizard existed counts as set up.
const wasSetUp = () => { try { return localStorage.getItem(ONB) === '1' || localStorage.getItem(KEY) !== null; } catch { return false; } };

function load(): Budget {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    const out = { ...DEFAULT_BUDGET };
    for (const k of Object.keys(out) as (keyof Budget)[]) {
      const v = Number(p?.[k]);
      if (Number.isFinite(v) && v >= 0) out[k] = v;
    }
    return out;
  } catch { return DEFAULT_BUDGET; }
}

export function calculateBudget(b: Budget) {
  const { income, rent, food, utilities, loans, savingsPercent } = b;
  const totalBills = rent + food + utilities + loans;
  const targetSavings = Math.round((income * savingsPercent) / 100);
  const freeMonthlySpending = income - totalBills - targetSavings;
  const pct = (n: number) => Math.round((n / (income || 1)) * 100);

  let healthState: 'great' | 'okay' | 'tight' = 'great';
  let healthMessage = 'Great job! You have plenty of comfortable spending money left every day.';
  if (freeMonthlySpending < 0) {
    healthState = 'tight';
    healthMessage = 'Caution: your bills and savings are higher than your income. See the easy money ways below to cover the gap.';
  } else if (freeMonthlySpending < income * 0.15) {
    healthState = 'okay';
    healthMessage = 'Your budget is a little tight. Stick to your daily limit.';
  }
  return {
    totalBills, targetSavings, freeMonthlySpending, healthState, healthMessage,
    dailySafeSpend: Math.max(0, Math.round(freeMonthlySpending / 30)),
    weeklySafeSpend: Math.max(0, Math.round(freeMonthlySpending / 4.3)),
    billsPercentage: pct(totalBills),
    freeSpendPercentage: pct(freeMonthlySpending),
  };
}
export type BudgetCalc = ReturnType<typeof calculateBudget>;

/** Single source of truth for the budget. Saved on this device once setup is finished. */
export function useBudget() {
  const [onboarded, setOnboarded] = useState<boolean>(wasSetUp);
  const [budget, setBudget] = useState<Budget>(() => (wasSetUp() ? load() : EMPTY_BUDGET));
  useEffect(() => {
    if (!onboarded) return; // don't persist half-finished wizard answers
    try { localStorage.setItem(KEY, JSON.stringify(budget)); localStorage.setItem(ONB, '1'); } catch { /* private mode */ }
  }, [budget, onboarded]);
  const set = useCallback((k: keyof Budget, v: number) => setBudget((p) => ({ ...p, [k]: Math.max(0, Math.round(v) || 0) })), []);
  const reset = useCallback(() => setBudget(DEFAULT_BUDGET), []);
  const finish = useCallback(() => setOnboarded(true), []);
  const restart = useCallback(() => setOnboarded(false), []);
  const skipWithSample = useCallback(() => { setBudget(DEFAULT_BUDGET); setOnboarded(true); }, []);
  const calculations = useMemo(() => calculateBudget(budget), [budget]);
  return { budget, set, reset, calculations, onboarded, finish, restart, skipWithSample };
}
