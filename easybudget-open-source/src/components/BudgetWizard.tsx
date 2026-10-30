import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight } from 'lucide-react';
import { MoneyField } from './MoneyField';
import { BILL_FIELDS } from './EasyBudgetCalculator';
import { formatINR } from '../utils/currency';
import type { Budget, BudgetCalc } from '../hooks/useBudget';

interface Props {
  budget: Budget;
  calculations: BudgetCalc;
  setField: (key: keyof Budget, value: number) => void;
  onFinish: () => void;
  onSample: () => void;
}

const STEPS = ['Income', 'Bills', 'Savings'] as const;
const INCOME_CHIPS = [25000, 40000, 65000, 100000];
const SAVE_PRESETS = [{ label: 'Just starting', value: 10 }, { label: 'Recommended', value: 20 }, { label: 'Fast', value: 30 }];

export function BudgetWizard({ budget, calculations, setField, onFinish, onSample }: Props) {
  const [step, setStep] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [step]);

  const { income, savingsPercent } = budget;
  const canNext = step !== 0 || income > 0;
  const left = income - calculations.totalBills;
  const next = () => { if (!canNext) return; step === 2 ? onFinish() : setStep(step + 1); };
  const h1 = 'font-display text-3xl sm:text-4xl font-black text-ink tracking-tight outline-none mt-8';

  return (
    <section
      className="max-w-xl mx-auto px-4 py-10 sm:py-16"
      onKeyDown={(e) => { if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') { e.preventDefault(); next(); } }}
    >
      <p className="font-display text-xl font-black text-brand">EasyBudget</p>
      <p className="mt-6 text-sm font-bold text-slate-600">Step {step + 1} of 3 · {STEPS[step]}</p>
      <div role="progressbar" aria-label="Setup progress" aria-valuemin={1} aria-valuemax={3} aria-valuenow={step + 1} className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
        <div className="h-full bg-brand transition-[width] duration-200" style={{ width: `${((step + 1) / 3) * 100}%` }} />
      </div>

      {step === 0 && (
        <div>
          <h1 ref={heading} tabIndex={-1} className={h1}>How much do you take home each month?</h1>
          <p className="mt-2 text-slate-600">After tax, into your bank account. A rough number is fine. You can change it later.</p>
          <label htmlFor="w-income" className="sr-only">Monthly take-home income in rupees</label>
          <div className="relative mt-6">
            <span aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-500">₹</span>
            <input
              id="w-income" type="text" inputMode="numeric" autoComplete="off" placeholder="e.g. 40000"
              value={income || ''} onChange={(e) => setField('income', Number(e.target.value.replace(/\D/g, '')) || 0)}
              className="w-full min-h-16 pl-10 pr-4 text-3xl font-bold tabular-nums text-ink bg-white border-2 border-slate-300 rounded-2xl"
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {INCOME_CHIPS.map((v) => (
              <button key={v} type="button" aria-pressed={income === v} onClick={() => setField('income', v)}
                className={`min-h-11 px-4 rounded-xl border text-sm font-bold cursor-pointer ${income === v ? 'bg-brand text-white border-brand' : 'bg-white text-ink border-slate-300 hover:border-brand'}`}>
                {formatINR(v)}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <h1 ref={heading} tabIndex={-1} className={h1}>What do you pay every month?</h1>
          <p className="mt-2 text-slate-600">Leave anything you don't pay at ₹0.</p>
          <div className="mt-6 space-y-3">
            {BILL_FIELDS.map((f) => (
              <MoneyField key={f.key} label={f.label} hint={f.hint} icon={f.icon} iconClass={f.iconClass} accent={f.accent}
                step={f.step} max={f.max(income)} value={budget[f.key]} onChange={(v) => setField(f.key, v)} />
            ))}
          </div>
          <p role="status" className={`mt-4 flex items-start gap-2 text-sm font-bold ${left < 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
            {left < 0 && <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />}
            {left >= 0 ? `${formatINR(left)} left after bills` : `Bills are ${formatINR(-left)} more than your income. We'll help with that on the results page.`}
          </p>
        </div>
      )}

      {step === 2 && (
        <div>
          <h1 ref={heading} tabIndex={-1} className={h1}>How much do you want to save?</h1>
          <p className="mt-2 text-slate-600">Saving first is the easiest way to actually save.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {SAVE_PRESETS.map((p) => (
              <button key={p.value} type="button" aria-pressed={savingsPercent === p.value} onClick={() => setField('savingsPercent', p.value)}
                className={`min-h-11 px-4 rounded-xl border text-sm font-bold cursor-pointer ${savingsPercent === p.value ? 'bg-brand text-white border-brand' : 'bg-white text-ink border-slate-300 hover:border-brand'}`}>
                {p.label} · {p.value}%
              </button>
            ))}
          </div>
          <label htmlFor="w-save" className="mt-5 block text-sm font-bold text-ink">Save {savingsPercent}% of income ({formatINR(calculations.targetSavings)}/mo)</label>
          <input id="w-save" type="range" min={0} max={Math.max(40, savingsPercent)} step={1} value={savingsPercent}
            onChange={(e) => setField('savingsPercent', Number(e.target.value))} className="mt-2 w-full cursor-pointer accent-[#1e3a8a]" />
          <div aria-live="polite" className="mt-6 p-5 rounded-2xl bg-white border border-slate-200">
            {calculations.freeMonthlySpending >= 0 ? (
              <>
                <p className="text-sm font-bold text-slate-600">You can spend about</p>
                <p className="font-display text-4xl font-black text-ink">{formatINR(calculations.dailySafeSpend)} <span className="text-lg font-bold text-slate-600">a day</span></p>
              </>
            ) : (
              <p className="flex items-start gap-2 text-sm font-bold text-rose-700">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                You're {formatINR(-calculations.freeMonthlySpending)} over each month. Try a lower saving goal, or see ways to earn extra on the next screen.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="mt-8 flex items-center justify-between gap-3">
        <button type="button" onClick={() => setStep(step - 1)} className={`inline-flex items-center gap-1.5 min-h-11 px-3 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100 cursor-pointer ${step === 0 ? 'invisible' : ''}`}>
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />Back
        </button>
        <button type="button" onClick={next} disabled={!canNext}
          className="inline-flex items-center gap-2 min-h-12 px-6 rounded-xl bg-brand hover:bg-[#172554] text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
          {step === 2 ? 'See my results' : 'Continue'}<ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
      <button type="button" onClick={onSample} className="mt-6 min-h-11 text-sm font-semibold text-slate-600 underline underline-offset-4 cursor-pointer">Skip, use sample numbers</button>
    </section>
  );
}
