import React, { useState } from 'react';
import { 
  Coffee, 
  ShoppingBag, 
  Flame, 
  Snowflake, 
  Sun, 
  Gift, 
  Zap, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  Percent
} from 'lucide-react';
import { MicroLeak, SeasonalSpike } from '../types';
import { formatINR } from '../utils/currency';

interface VariableCostSentinelProps {
  onLogMicroWin: (title: string, amount: number) => void;
  gentleMode: boolean;
}

export const VariableCostSentinel: React.FC<VariableCostSentinelProps> = ({
  onLogMicroWin,
  gentleMode,
}) => {
  const [leaks, setLeaks] = useState<MicroLeak[]>([
    {
      id: 'leak-1',
      name: 'Swiggy / Zomato Delivery & Platform Surcharges',
      unitCost: 85,
      frequencyPerWeek: 4,
      monthlyDrain: 1472,
      category: 'Delivery Fee',
      painlessAlternative: 'Order directly or batch-cook quick 15-minute weekday meals',
    },
    {
      id: 'leak-2',
      name: 'Specialty Cold Brew & Cafe Meetups',
      unitCost: 320,
      frequencyPerWeek: 3,
      monthlyDrain: 4160,
      category: 'Coffee',
      painlessAlternative: 'Batch brew specialty Blue Tokai / Sleepy Owl cold brew at home (₹35/cup)',
    },
    {
      id: 'leak-3',
      name: 'Unused OTT & App Trials (YouTube Premium / Extra Cloud)',
      unitCost: 499,
      frequencyPerWeek: 0.25,
      monthlyDrain: 499,
      category: 'Impulse Sub',
      painlessAlternative: 'Audit recurring Google Play / Apple UPI mandates and cancel idle services',
    },
    {
      id: 'leak-4',
      name: 'Cab / Auto-Rickshaw Peak Surge for Short Distances (<2 km)',
      unitCost: 180,
      frequencyPerWeek: 3,
      monthlyDrain: 2340,
      category: 'Service Fee',
      painlessAlternative: 'Use Metro feeder or walk for distances under 1.5 km',
    },
  ]);

  const [activeSeasonTab, setActiveSeasonTab] = useState<'summer' | 'winter' | 'holidays'>('summer');

  const seasonalForecasts: Record<string, SeasonalSpike> = {
    summer: {
      month: 'April - June',
      utilitySpike: 45,
      holidayBudgetDelta: 4500,
      advice: 'Dual split AC cooling in peak summer pushes slab rates up. Keep thermostats at 24°C and service filters to save ~₹1,200/mo.',
    },
    winter: {
      month: 'December - January',
      utilitySpike: 25,
      holidayBudgetDelta: 3200,
      advice: 'Water heaters (geysers) and room heaters surge morning peak loads. Turn off geysers right after heating.',
    },
    holidays: {
      month: 'October - November (Diwali / Wedding Season)',
      utilitySpike: 15,
      holidayBudgetDelta: 15000,
      advice: 'Diwali gifting, festive clothing, and family travel is the #1 cause of year-end credit card dues. Stash ₹1,500/mo throughout the year to neutralize.',
    },
  };

  const totalMonthlyLeakDrain = leaks.reduce((acc, l) => acc + l.monthlyDrain, 0);
  const totalAnnualLeakDrain = Math.round(totalMonthlyLeakDrain * 12);

  const handleEliminateLeak = (leak: MicroLeak) => {
    // Log as a micro-win!
    onLogMicroWin(`Defeated ${leak.name}`, Math.round(leak.monthlyDrain / 4));
    // Reduce frequency
    setLeaks((prev) =>
      prev.map((item) =>
        item.id === leak.id
          ? {
              ...item,
              frequencyPerWeek: Math.max(0, item.frequencyPerWeek - 1),
              monthlyDrain: Number((item.unitCost * Math.max(0, item.frequencyPerWeek - 1) * 4.33).toFixed(0)),
            }
          : item
      )
    );
  };

  const currentSpike = seasonalForecasts[activeSeasonTab];

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 stripe-card-glow space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-pink-600 bg-pink-50 px-2.5 py-0.5 rounded mb-1">
            <Coffee className="w-3.5 h-3.5" />
            Variable Cost Chaos
          </div>
          <h3 className="text-xl font-extrabold text-[#0a2540] tracking-tight">
            Micro-Leak & Seasonal Volatility Sentinel (INR)
          </h3>
          <p className="text-xs text-[#425466]">
            Uncovers micro-transaction fees, delivery markups, and festival/summer utility waves in Rupees (₹) before they erode your savings.
          </p>
        </div>

        {/* Drain Summary */}
        <div className="p-3 rounded-xl bg-pink-50/70 border border-pink-100 text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-pink-800 block">
            Annual Micro-Leak Drain
          </span>
          <span className="text-xl font-black text-pink-900">
            -{formatINR(totalAnnualLeakDrain)}
          </span>
          <span className="text-[10px] text-pink-700 block mt-0.5">
            -{formatINR(Math.round(totalMonthlyLeakDrain))}/mo in silent friction
          </span>
        </div>
      </div>

      {/* Micro Leaks Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Detected Stealth Friction Charges
          </h4>
          <span className="text-xs text-slate-400">Click "Plug Leak" to log an instant Micro-Win</span>
        </div>

        <div className="space-y-2.5">
          {leaks.map((leak) => (
            <div
              key={leak.id}
              className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#0a2540]">{leak.name}</span>
                  <span className="text-[10px] font-semibold text-pink-700 bg-pink-50 px-1.5 py-0.5 rounded border border-pink-100">
                    {leak.category}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    ({formatINR(leak.unitCost)} &times; {leak.frequencyPerWeek}x/wk)
                  </span>
                </div>
                <p className="text-[11px] text-[#425466]">
                  ✨ <strong>Painless Swap:</strong> {leak.painlessAlternative}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                <span className="text-sm font-extrabold text-pink-700">
                  -{formatINR(Math.round(leak.monthlyDrain))}/mo
                </span>
                <button
                  onClick={() => handleEliminateLeak(leak)}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>Plug Leak</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Seasonal Spike Volatility Wave */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#0a2540] flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Seasonal Spike & Volatility Forecast
          </h4>

          {/* Season Selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveSeasonTab('summer')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeSeasonTab === 'summer' ? 'bg-white text-[#0a2540] shadow-xs' : 'text-slate-500'
              }`}
            >
              <Sun className="w-3 h-3 text-amber-500" />
              Summer AC Peak
            </button>
            <button
              onClick={() => setActiveSeasonTab('winter')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeSeasonTab === 'winter' ? 'bg-white text-[#0a2540] shadow-xs' : 'text-slate-500'
              }`}
            >
              <Snowflake className="w-3 h-3 text-cyan-500" />
              Winter Water Heaters
            </button>
            <button
              onClick={() => setActiveSeasonTab('holidays')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeSeasonTab === 'holidays' ? 'bg-white text-[#0a2540] shadow-xs' : 'text-slate-500'
              }`}
            >
              <Gift className="w-3 h-3 text-pink-500" />
              Diwali & Weddings
            </button>
          </div>
        </div>

        {/* Spike Card */}
        <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[#0a2540]">{currentSpike.month}</span>
              <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                +{currentSpike.utilitySpike}% Rate Fluctuation
              </span>
            </div>
            <p className="text-amber-900 leading-relaxed max-w-xl">
              {currentSpike.advice}
            </p>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Recommended Pre-Buffer</span>
            <span className="text-xl font-black text-amber-800">+{formatINR(currentSpike.holidayBudgetDelta)}</span>
          </div>
        </div>

      </div>

    </div>
  );
};
