import React from 'react';
import { Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200/90 text-[#425466]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-100">
          
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#1e3a8a] to-[#f59e0b] flex items-center justify-center text-white font-extrabold text-sm shadow-xs">
              ₹
            </div>
            <div>
              <span className="font-extrabold text-base text-[#0a2540] tracking-tight">EasyBudget</span>
              <p className="text-xs text-[#64748b]">
                Simple budget calculator & Google-grounded extra money finder.
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex items-center gap-6 text-xs font-semibold">
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-[#1e3a8a] transition-colors cursor-pointer"
            >
              Budget Calculator
            </a>
            <a
              href="#easy-money-section"
              className="hover:text-[#1e3a8a] transition-colors cursor-pointer"
            >
              Ways To Make Extra Money
            </a>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} EasyBudget. Built for everyday people to spend with confidence.</p>
          <p className="flex items-center gap-1">
            <span>Powered by Gemini 3.8 & Google Search</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
