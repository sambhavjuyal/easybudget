/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { Suspense, lazy, useCallback, useState } from 'react';
import { Navbar } from './components/Navbar';
import { EasyBudgetCalculator } from './components/EasyBudgetCalculator';
import { Footer } from './components/Footer';
import { BudgetWizard } from './components/BudgetWizard';
import { SettingsDialog } from './components/SettingsDialog';
import { useBudget } from './hooks/useBudget';

// The game is split out of the first bundle and loads only when opened.
const MoneyMasterGame = lazy(() => import('./components/MoneyMasterGame').then((m) => ({ default: m.MoneyMasterGame })));

const Loading = () => (
  <div className="min-h-screen grid place-items-center text-sm font-semibold text-slate-600" role="status">Loading…</div>
);

export default function App() {
  const [view, setView] = useState<'calculator' | 'game'>('calculator');
  const { budget, set, reset, calculations, onboarded, finish, restart, skipWithSample } = useBudget();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [keyVersion, setKeyVersion] = useState(0);
  const playGame = useCallback(() => setView('game'), []);

  if (view === 'game') {
    return (
      <Suspense fallback={<Loading />}>
        <MoneyMasterGame onExitGame={() => setView('calculator')} defaultSalary={budget.income} />
      </Suspense>
    );
  }

  if (!onboarded) {
    return (
      <div className="min-h-screen font-sans bg-paper text-ink">
        <main id="main" tabIndex={-1} className="outline-none">
          <BudgetWizard budget={budget} calculations={calculations} setField={set} onFinish={finish} onSample={skipWithSample} />
        </main>
      </div>
    );
  }

  return (
    <div id="top" className="min-h-screen flex flex-col font-sans bg-[#fbf8f3] text-[#0a2540]">
      <a href="#main" className="skip-link">Skip to main content</a>
      <Navbar onPlayGame={playGame} onOpenSettings={() => setSettingsOpen(true)} />

      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <div className="bg-slate-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 flex justify-end">
            <button type="button" onClick={restart} className="min-h-11 px-3 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-200/60 cursor-pointer">
              Edit answers step by step
            </button>
          </div>
        </div>
        <EasyBudgetCalculator
          budget={budget}
          setField={set}
          resetBudget={reset}
          calculations={calculations}
          onPlayGame={playGame}
          onOpenSettings={() => setSettingsOpen(true)}
          keyVersion={keyVersion}
        />
      </main>

      <Footer />
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} onKeyChanged={() => setKeyVersion((v) => v + 1)} />
    </div>
  );
}
