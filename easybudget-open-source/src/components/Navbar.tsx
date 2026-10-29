import React, { useState } from 'react';
import { 
  Wallet,
  TrendingUp,
  X,
  Menu,
  Gamepad2,
  Settings
} from 'lucide-react';

interface NavbarProps {
  onScrollToSection?: (sectionId: string) => void;
  onPlayGame?: () => void;
  onOpenSettings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onScrollToSection,
  onPlayGame,
  onOpenSettings,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18">
            
            {/* Logo */}
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2.5 text-left group cursor-pointer">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1e3a8a] to-[#f59e0b] flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                  <span className="font-black text-white text-lg tracking-tight">₹</span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-xl tracking-tight text-[#0a2540]">EasyBudget</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                      Simple
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748b] font-medium leading-none">
                    Know what you can spend • Make extra cash
                  </p>
                </div>
              </div>

              {/* Desktop Nav Links */}
              <nav className="hidden md:flex items-center gap-2">
                <a
                  href="#top"
                  onClick={(e) => {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#425466] hover:text-[#0a2540] hover:bg-slate-100/60 transition-colors cursor-pointer"
                >
                  <Wallet className="w-3.5 h-3.5 text-[#1e3a8a]" />
                  <span>Budget Calculator</span>
                </a>

                {onPlayGame && (
                  <button
                    onClick={onPlayGame}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#1e3a8a] bg-[#1e3a8a]/10 hover:bg-[#1e3a8a]/20 transition-all cursor-pointer"
                  >
                    <Gamepad2 className="w-3.5 h-3.5" aria-hidden="true" /><span>Play Rupee Master</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] animate-pulse" />
                  </button>
                )}

                <a
                  href="#easy-money-section"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#425466] hover:text-[#0a2540] hover:bg-slate-100/60 transition-colors cursor-pointer"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ways To Make Extra Money</span>
                </a>
              </nav>
            </div>

            {/* Right CTA Buttons */}
            <div className="hidden sm:flex items-center gap-3">
              {onPlayGame && (
                <button
                  onClick={onPlayGame}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold text-[#1e3a8a] bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-all cursor-pointer shadow-sm"
                >
                  <Gamepad2 className="w-3.5 h-3.5" aria-hidden="true" /><span>Play Money Game</span>
                </button>
              )}
              {onOpenSettings && (
                <button onClick={onOpenSettings} aria-label="Settings" className="p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer">
                  <Settings className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Mobile menu trigger */}
            <div className="sm:hidden flex items-center gap-2">
              {onPlayGame && (
                <button
                  onClick={onPlayGame}
                  className="px-2.5 py-1.5 text-xs font-bold bg-[#1e3a8a] text-white rounded-lg shadow-sm cursor-pointer"
                ><Gamepad2 className="w-3.5 h-3.5 inline mr-1" aria-hidden="true" />Play</button>
              )}
              {onOpenSettings && (
                <button onClick={onOpenSettings} aria-label="Settings" className="p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer">
                  <Settings className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu" aria-expanded={mobileMenuOpen}
                className="p-2.5 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden px-4 pt-2 pb-4 space-y-2 bg-white border-b border-slate-200 text-xs">
            <a
              href="#top"
              onClick={() => {
                setMobileMenuOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="block py-2 font-semibold text-[#0a2540]"
            >
              Budget Calculator
            </a>
            <a
              href="#easy-money-section"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 font-semibold text-[#0a2540]"
            >
              Ways To Make Extra Money
            </a>
          </div>
        )}
      </header>

    </>
  );
};
