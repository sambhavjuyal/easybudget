import React, { useId } from 'react';
import type { LucideIcon } from 'lucide-react';

interface MoneyFieldProps {
  label: string; hint: string; icon: LucideIcon; iconClass: string; accent: string;
  value: number; max: number; step: number; onChange: (v: number) => void;
}

/** Labelled amount: exact typing OR slider, both keyboard/screen-reader friendly. */
export const MoneyField = React.memo(function MoneyField({
  label, hint, icon: Icon, iconClass, accent, value, max, step, onChange,
}: MoneyFieldProps) {
  const id = useId();
  return (
    <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={`${id}-n`} className="text-sm font-bold text-[#0a2540] flex items-center gap-2">
          <Icon className={`w-4 h-4 shrink-0 ${iconClass}`} aria-hidden="true" />
          {label}
        </label>
        <div className="relative w-32 shrink-0">
          <span aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">₹</span>
          <input
            id={`${id}-n`} type="text" inputMode="numeric" autoComplete="off" aria-describedby={`${id}-h`}
            value={value}
            onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, '')) || 0)}
            className="w-full min-h-11 pl-7 pr-3 text-right tabular-nums font-bold text-[#0a2540] bg-white border border-slate-300 rounded-xl"
          />
        </div>
      </div>
      <input
        type="range" aria-label={`${label}, slider`} min={0} max={Math.max(max, value)} step={step}
        value={value} onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full cursor-pointer ${accent}`}
      />
      <p id={`${id}-h`} className="text-xs text-slate-600">{hint}</p>
    </div>
  );
});
