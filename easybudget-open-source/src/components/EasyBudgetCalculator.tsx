import React, { useState, useEffect, useRef } from 'react';
import { 
  Wallet, 
  Sparkles, 
  TrendingUp, 
  Calendar, 
  ArrowRight, 
  Search, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Smile, 
  Clock, 
  Briefcase, 
  DollarSign, 
  RefreshCw, 
  ChevronRight,
  Flame,
  ShieldCheck,
  Building,
  Layers,
  ShoppingBag,
  Zap,
  Home,
  CreditCard,
  PiggyBank,
  Gamepad2,
  PenLine,
  Headphones,
  Smartphone,
  GraduationCap,
  RotateCcw
} from 'lucide-react';
import { formatINR } from '../utils/currency';
import { JobListing, GroundingSource } from '../types';
import { MoneyField } from './MoneyField';
import type { Budget, BudgetCalc } from '../hooks/useBudget';

export const BILL_FIELDS = [
  { key: 'rent', label: 'House rent / room payment', hint: 'Usually 25–35% of your income.', icon: Home, iconClass: 'text-[#1e3a8a]', accent: 'accent-[#1e3a8a]', step: 500, max: (i: number) => Math.max(80000, i * 0.7) },
  { key: 'food', label: 'Food, groceries & milk', hint: 'Cooking at home, vegetables, dairy, staples.', icon: ShoppingBag, iconClass: 'text-emerald-700', accent: 'accent-emerald-600', step: 500, max: () => 40000 },
  { key: 'utilities', label: 'Electricity, phone & WiFi', hint: 'Power bill, mobile recharge, broadband.', icon: Zap, iconClass: 'text-amber-700', accent: 'accent-amber-600', step: 200, max: () => 20000 },
  { key: 'loans', label: 'Loan EMIs / credit card bills', hint: 'Bike or car loan, student loan, phone EMI.', icon: CreditCard, iconClass: 'text-rose-700', accent: 'accent-rose-600', step: 500, max: (i: number) => Math.max(50000, i * 0.5) },
] as const;

interface EasyBudgetCalculatorProps {
  budget: Budget;
  setField: (key: keyof Budget, value: number) => void;
  resetBudget: () => void;
  calculations: BudgetCalc;
  onPlayGame?: () => void;
  onOpenSettings?: () => void;
  keyVersion?: number;
}

export const EasyBudgetCalculator: React.FC<EasyBudgetCalculatorProps> = ({
  budget,
  setField,
  resetBudget,
  calculations,
  onPlayGame,
  onOpenSettings,
  keyVersion = 0,
}) => {
  const { income, rent, food, utilities, loans, savingsPercent } = budget;
  const setIncome = (v: number) => setField('income', v);
  const setSavingsPercent = (v: number) => setField('savingsPercent', v);

  // Extra money target
  const [extraMoneyGoal, setExtraMoneyGoal] = useState<number>(15000);
  const [jobCategory, setJobCategory] = useState<string>('Work From Home / Remote');
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [jobSummary, setJobSummary] = useState<string>('');
  const [jobSources, setJobSources] = useState<GroundingSource[]>([]);
  const [loadingJobs, setLoadingJobs] = useState<boolean>(false);
  const [jobSearchError, setJobSearchError] = useState<string | null>(null);

  // Quick Income Preset Buttons
  const incomePresets = [
    { label: '₹35,000', value: 35000 },
    { label: '₹50,000', value: 50000 },
    { label: '₹65,000', value: 65000 },
    { label: '₹90,000', value: 90000 },
    { label: '₹1,25,000', value: 125000 },
  ];


  // Search real side jobs via Google Grounding from specific portals
  const fetchEasyMoneyJobs = async (categoryName?: string) => {
    setLoadingJobs(true);
    setJobSearchError(null);
    const cat = categoryName || jobCategory;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const api = window.easybudget;
      if (!api) throw new Error('Live job search works in the EasyBudget desktop app.');
      const out = await api.searchJobs({
        query: cat,
        location: 'India / Remote / Work From Home',
        targetDeficit: extraMoneyGoal,
        category: cat,
      });
      if (ctrl.signal.aborted) return; // a newer search replaced this one
      if (!out.ok) {
        setJobs([]);
        throw new Error(out.error);
      }
      setJobs(out.data.jobs || []);
      setJobSummary(out.data.summary || '');
      setJobSources(out.sources || []);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setJobSearchError(err?.message || 'Failed to search job portals via Google.');
    } finally {
      if (abortRef.current === ctrl) setLoadingJobs(false);
    }
  };

  const moneyRef = useRef<HTMLElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => {
    const el = moneyRef.current;
    if (!el || !('IntersectionObserver' in window)) { fetchEasyMoneyJobs(); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); fetchEasyMoneyJobs(); } }, { rootMargin: '200px' });
    io.observe(el);
    return () => { io.disconnect(); abortRef.current?.abort(); };
  }, []);

  // Retry the search right after the user saves a key in Settings.
  useEffect(() => { if (keyVersion > 0) fetchEasyMoneyJobs(); }, [keyVersion]);

  const easyJobCategories = [
    { label: 'Work From Home / Remote', icon: Home, desc: 'Flexible hours from your laptop' },
    { label: 'Typing & Content Review', icon: PenLine, desc: 'Proofreading, data review & transcripts' },
    { label: 'Customer Chat & Support', icon: Headphones, desc: 'Email/chat help for apps during evenings' },
    { label: 'Weekend & Part-Time Gigs', icon: Smartphone, desc: 'Saturday-Sunday flexible tasks' },
    { label: 'Online Tutoring & Teaching', icon: GraduationCap, desc: 'Teach school subjects or spoken English' },
  ];

  return (
    <div className="space-y-12">
      
      {/* 1. Header with Stripe Mesh Gradient Accent */}
      <section className="relative overflow-hidden pt-10 pb-8 bg-gradient-to-b from-slate-50 via-white to-white border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1e3a8a]/10 border border-[#1e3a8a]/20 text-[#1e3a8a] text-xs font-bold mb-4">
            <Sparkles className="w-4 h-4" />
            <span>Simple Budget Calculator • No Finance Jargon</span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl font-black text-[#0a2540] tracking-tight max-w-3xl mx-auto leading-tight">
            How much can you <span className="bg-gradient-to-r from-[#1e3a8a] via-[#2563eb] to-[#f59e0b] bg-clip-text text-transparent">safely spend</span> every day?
          </h1>

          <p className="mt-4 text-base sm:text-lg text-[#425466] max-w-2xl mx-auto leading-relaxed">
            Enter your monthly earnings and bills below. We'll give you your exact <strong>daily spending limit</strong>, and show you <strong>easy ways to make extra money</strong> if you need more.
          </p>

          {/* Key Answer Cards: The 3 Big Numbers Everyday People Need */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto text-left">
            
            {/* Card 1: Safe Daily Limit */}
            <div className="p-6 rounded-2xl bg-white border-2 border-emerald-500/30 shadow-lg shadow-emerald-500/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-0 pointer-events-none" />
              <div className="relative z-10">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md inline-block mb-2">
                  Safe To Spend Today
                </span>
                <div aria-live="polite" className="font-display text-3xl sm:text-4xl font-black text-[#0a2540] tracking-tight">
                  {formatINR(calculations.dailySafeSpend)}
                  <span className="text-sm font-semibold text-slate-400 font-normal"> / day</span>
                </div>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Spend this on tea, lunch, shopping, or fun today without feeling guilty.
                </p>
              </div>
            </div>

            {/* Card 2: Safe Weekly Allowance */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/60 rounded-bl-full -z-0 pointer-events-none" />
              <div className="relative z-10">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#1e3a8a] bg-indigo-50 px-2.5 py-1 rounded-md inline-block mb-2">
                  Safe Weekly Budget
                </span>
                <div className="font-display text-3xl sm:text-4xl font-black text-[#0a2540] tracking-tight">
                  {formatINR(calculations.weeklySafeSpend)}
                  <span className="text-sm font-semibold text-slate-400 font-normal"> / week</span>
                </div>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Your weekly allowance for weekend outings, movies, and eating out.
                </p>
              </div>
            </div>

            {/* Card 3: Free Cash Left for Month */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-pink-50/60 rounded-bl-full -z-0 pointer-events-none" />
              <div className="relative z-10">
                <span className="text-[11px] font-bold uppercase tracking-wider text-pink-600 bg-pink-50 px-2.5 py-1 rounded-md inline-block mb-2">
                  Total Free Money Left
                </span>
                <div className={`font-display text-3xl sm:text-4xl font-black tracking-tight ${
                  calculations.freeMonthlySpending < 0 ? 'text-rose-600' : 'text-[#0a2540]'
                }`}>
                  {formatINR(calculations.freeMonthlySpending)}
                  <span className="text-sm font-semibold text-slate-400 font-normal"> / mo</span>
                </div>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  {calculations.freeMonthlySpending >= 0 
                    ? `Pure free money left after paying all bills and saving ${formatINR(calculations.targetSavings)}.`
                    : 'Your bills exceed your earnings. Look below for easy ways to earn extra cash.'}
                </p>
              </div>
            </div>

          </div>

          {/* Friendly Status Alert */}
          <div className="mt-5 max-w-4xl mx-auto">
            <div role="status" className={`p-3.5 rounded-xl border flex items-center justify-between text-xs sm:text-sm font-medium ${
              calculations.healthState === 'great' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                : calculations.healthState === 'okay'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              <div className="flex items-center gap-2 text-left">
                {calculations.healthState === 'great' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                )}
                <span>{calculations.healthMessage}</span>
              </div>
              
              <a
                href="#easy-money-section"
                className="hidden sm:inline-flex items-center gap-1 text-xs font-bold underline shrink-0 cursor-pointer text-[#1e3a8a]"
              >
                <span>Make Extra Money</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Interactive Game Teaser Banner */}
          {onPlayGame && (
            <div className="mt-6 max-w-4xl mx-auto">
              <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0a2540] via-[#1e1b4b] to-[#311042] text-white shadow-xl shadow-indigo-950/20 border border-indigo-900/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-left relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-36 h-36 bg-[#1e3a8a] rounded-full blur-3xl opacity-30 pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-[#f59e0b] rounded-full blur-3xl opacity-20 pointer-events-none" />

                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1e3a8a] to-[#f59e0b] flex items-center justify-center text-white text-2xl font-black shrink-0 shadow-lg shadow-indigo-500/30"><Gamepad2 className="w-6 h-6" aria-hidden="true" /></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                        New: Rupee Master 50-30-20 Wealth Quest
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#f59e0b] text-white">
                        Play & Learn
                      </span>
                    </div>
                    <p className="text-xs text-indigo-200 mt-0.5 max-w-xl leading-relaxed">
                      A fast, fun game that teaches you <strong>exactly how much to spend on essentials (50%)</strong>, <strong>how to save (20%)</strong>, and <strong>where to invest for compounding (30%)</strong> while dodging temptation debt traps!
                    </p>
                  </div>
                </div>

                <button
                  onClick={onPlayGame}
                  className="relative z-10 w-full sm:w-auto px-5 py-3 rounded-xl bg-[#1e3a8a] hover:bg-[#172554] text-white font-extrabold text-xs shadow-lg shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  <span>Play Game Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* 2. The Simple Budget Calculator Form */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-xl shadow-slate-900/5 space-y-8">
          
          <div className="border-b border-slate-100 pb-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-2xl font-extrabold text-[#0a2540] tracking-tight">Your monthly money &amp; bills</h2>
              <button type="button" onClick={resetBudget} className="inline-flex items-center gap-1.5 min-h-11 px-3 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer">
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />Reset
              </button>
            </div>
            <p className="text-sm text-[#425466] mt-1">
              Type an exact amount or drag a slider. Your numbers are saved on this device.
            </p>
          </div>

          {/* Monthly Income Input with Quick Chips */}
          <div className="space-y-3 bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label htmlFor="income" className="text-sm font-bold text-[#0a2540] flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#1e3a8a]" />
                How much money do you take home each month?
              </label>
              <div className="relative w-48">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                <input
                  id="income" type="text" inputMode="numeric" autoComplete="off"
                  value={income}
                  onChange={(e) => setIncome(Number(e.target.value.replace(/\D/g, '')) || 0)}
                  className="w-full min-h-11 pl-8 pr-3 tabular-nums bg-white border border-slate-300 rounded-xl font-bold text-base text-[#0a2540] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
                />
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-xs text-slate-500 font-medium">Quick Pick:</span>
              {incomePresets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setIncome(preset.value)}
                  aria-pressed={income === preset.value}
                  className={`text-xs px-3.5 min-h-11 rounded-lg border font-semibold transition-all cursor-pointer ${
                    income === preset.value
                      ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]'
                      : 'bg-white text-[#425466] border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {BILL_FIELDS.map((f) => (
              <MoneyField
                key={f.key} label={f.label} hint={f.hint} icon={f.icon} iconClass={f.iconClass}
                accent={f.accent} step={f.step} max={f.max(income)}
                value={budget[f.key]} onChange={(v) => setField(f.key, v)}
              />
            ))}
          </div>

          {/* How Much to Save Slider */}
          <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0a2540] flex items-center gap-2">
                <PiggyBank className="w-4 h-4 text-[#1e3a8a]" />
                How much do you want to save every month? ({savingsPercent}%)
              </span>
              <span className="text-sm font-extrabold text-[#1e3a8a]">
                {formatINR(calculations.targetSavings)} / mo
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={40}
              step={5}
              value={savingsPercent}
              onChange={(e) => setSavingsPercent(parseInt(e.target.value) || 0)}
              className="w-full accent-[#1e3a8a] cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>0% (No savings)</span>
              <span>10% (Good start)</span>
              <span>20% (Recommended)</span>
              <span>30%+ (Fast wealth)</span>
            </div>
          </div>

          {/* Visual Breakdown Bar: Where Does Your Money Go? */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-xs font-bold text-[#0a2540]">
              <span>Where your money goes:</span>
              <span>
                Bills: {calculations.billsPercentage}% • Savings: {savingsPercent}% • Free Spend: {Math.max(0, calculations.freeSpendPercentage)}%
              </span>
            </div>

            <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
              <div 
                className="bg-rose-500 transition-all duration-300"
                style={{ width: `${Math.min(100, calculations.billsPercentage)}%` }}
                title={`Bills: ${formatINR(calculations.totalBills)}`}
              />
              <div 
                className="bg-[#1e3a8a] transition-all duration-300"
                style={{ width: `${Math.min(100 - calculations.billsPercentage, savingsPercent)}%` }}
                title={`Savings: ${formatINR(calculations.targetSavings)}`}
              />
              <div 
                className="bg-emerald-500 transition-all duration-300"
                style={{ width: `${Math.max(0, calculations.freeSpendPercentage)}%` }}
                title={`Free Spending: ${formatINR(calculations.freeMonthlySpending)}`}
              />
            </div>

            <div className="flex items-center justify-center gap-6 pt-1 text-xs text-[#425466]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                Must-Pay Bills ({formatINR(calculations.totalBills)})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1e3a8a]" />
                Savings Put Aside ({formatINR(calculations.targetSavings)})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Safe Spending Money ({formatINR(calculations.freeMonthlySpending)})
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* 3. "What's The Way You Can Make Easy Money Out Of It?" */}
      <section id="easy-money-section" ref={moneyRef} className="scroll-mt-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-indigo-50/70 via-white to-pink-50/30 rounded-3xl p-6 sm:p-10 border border-indigo-100 shadow-xl shadow-indigo-500/5 space-y-8">
          
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-indigo-100 pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#1e3a8a] bg-white px-2.5 py-1 rounded-md border border-indigo-200/80 mb-2">
                <TrendingUp className="w-4 h-4 text-[#1e3a8a]" />
                Easy Ways To Make Extra Money
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a2540] tracking-tight">
                Want more cash? Here's how to make easy extra money.
              </h2>
              <p className="text-sm text-[#425466] mt-1 max-w-2xl">
                We use <strong>Google Search</strong> to check specific job portals (Naukri, Indeed, LinkedIn, Internshala, RemoteOK) for flexible part-time and online side gigs you can do right now.
              </p>
            </div>

            {/* Extra Money Target Picker */}
            <div className="bg-white p-3.5 rounded-2xl border border-indigo-100 shadow-xs shrink-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Target Extra Cash:
              </span>
              <div className="flex items-center gap-1.5">
                {[10000, 15000, 25000, 40000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => {
                      setExtraMoneyGoal(amount);
                    }}
                    className={`text-xs px-3 min-h-11 rounded-lg font-bold transition-all cursor-pointer ${
                      extraMoneyGoal === amount
                        ? 'bg-[#1e3a8a] text-white shadow-xs'
                        : 'bg-slate-50 text-[#0a2540] hover:bg-indigo-50'
                    }`}
                  >
                    +{formatINR(amount)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Hours Needed Explainer */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2.5 text-[#0a2540]">
              <Clock className="w-5 h-5 text-[#1e3a8a] shrink-0" />
              <span>
                To make an extra <strong>{formatINR(extraMoneyGoal)}/mo</strong>, you need about <strong>{Math.max(1, Math.round(extraMoneyGoal / (300 * 4.3)))} hours a week</strong> at roughly ₹300/hour.{calculations.freeMonthlySpending < 0 && <> Your current shortfall is <strong>{formatINR(-calculations.freeMonthlySpending)}/mo</strong>.</>}
              </span>
            </div>
            <button
              onClick={() => fetchEasyMoneyJobs(jobCategory)}
              disabled={loadingJobs}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1e3a8a] hover:text-[#172554] bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 cursor-pointer self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingJobs ? 'animate-spin' : ''}`} />
              <span>Search Fresh Gigs</span>
            </button>
          </div>

          {/* 1-Click Category Filter Pills */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Choose the kind of easy work you like:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {easyJobCategories.map((cat) => {
                const isSelected = jobCategory === cat.label;
                return (
                  <button
                    key={cat.label}
                    onClick={() => {
                      setJobCategory(cat.label);
                      fetchEasyMoneyJobs(cat.label);
                    }}
                    aria-pressed={isSelected}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#1e3a8a] text-white border-[#1e3a8a] shadow-md shadow-indigo-500/20'
                        : 'bg-white text-[#0a2540] border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    <cat.icon className="w-5 h-5 mb-1.5" aria-hidden="true" />
                    <span className="text-xs font-extrabold block">{cat.label}</span>
                    <span className={`text-[10px] block mt-0.5 leading-tight ${
                      isSelected ? 'text-indigo-100' : 'text-slate-400'
                    }`}>
                      {cat.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Job Listings from Google Grounded Search */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                {jobs.length > 0 ? <>Opportunities found for <strong>{jobCategory}</strong>:</> : <>Searching for <strong>{jobCategory}</strong></>}
              </span>
              {jobSources.length > 0 && (
                <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                  ✓ Verified via Google Search on Job Portals
                </span>
              )}
            </div>

            {loadingJobs ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 bg-white rounded-2xl border border-slate-200">
                <RefreshCw className="w-8 h-8 text-[#1e3a8a] animate-spin" />
                <h4 className="text-sm font-bold text-[#0a2540]">
                  Searching Naukri, Indeed, LinkedIn, & Internshala via Google...
                </h4>
                <p className="text-xs text-slate-400">
                  Finding real flexible roles that pay around {formatINR(extraMoneyGoal)}/mo.
                </p>
              </div>
            ) : jobSearchError ? (
              <>
                {jobSearchError === 'NO_KEY' ? (
                  <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-sm text-ink flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p>Live job search uses your own free Gemini key, stored only on this computer.</p>
                    {onOpenSettings && (
                      <button type="button" onClick={onOpenSettings} className="min-h-11 px-4 rounded-xl bg-brand text-white text-sm font-bold cursor-pointer shrink-0">
                        Add your Gemini key
                      </button>
                    )}
                  </div>
                ) : (
                  <div role="alert" className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">{jobSearchError}</div>
                )}
              </>
            ) : jobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/5 transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#1e3a8a] bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                          {job.portalName}
                        </span>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                          {job.payRate}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-[#0a2540] group-hover:text-[#1e3a8a] transition-colors leading-snug">
                        {job.title}
                      </h4>

                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>{job.company}</span>
                        <span>•</span>
                        <span className="font-medium text-[#0a2540]">{job.workType}</span>
                        <span>•</span>
                        <span>{job.commitment}</span>
                      </div>

                      <p className="text-xs text-[#425466] leading-relaxed line-clamp-2">
                        {job.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-[11px] text-emerald-700 font-bold">
                        +{formatINR(job.estimatedMonthlyBoost || extraMoneyGoal)}/mo extra cash
                      </div>

                      <a
                        href={job.portalUrl.startsWith('http') ? job.portalUrl : `https://${job.portalUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#1e3a8a] hover:text-[#172554] group-hover:translate-x-0.5 transition-transform"
                      >
                        <span>Apply / View on {job.portalName}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Google Search Citations / Source Badges */}
            {jobSources.length > 0 && (
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs flex flex-wrap items-center gap-2">
                <span className="text-slate-400 font-semibold">Google Search Verified Portals:</span>
                {jobSources.map((src, i) => (
                  <a
                    key={i}
                    href={src.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#1e3a8a] hover:underline bg-indigo-50/70 px-2 py-0.5 rounded text-[11px]"
                  >
                    <span>{src.title}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                ))}
              </div>
            )}
          </div>

        </div>
      </section>

    </div>
  );
};
