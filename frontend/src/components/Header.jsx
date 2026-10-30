import React from 'react';
import { Calendar, Clock, ShieldAlert, Zap, TrendingUp, BarChart3, Sun, Moon } from 'lucide-react';

export default function Header({
  selectedDate,
  onDateChange,
  availableDates,
  gateClosureHour,
  onGateClosureChange,
  riskProfile,
  onRiskProfileChange,
  activeTab,
  onTabChange,
  decisionDate,
  gateCutoffIso,
  isDarkMode,
  onToggleTheme
}) {
  return (
    <header className="bg-white dark:bg-[#0c0c0e] border-b border-slate-200 dark:border-zinc-800/80 sticky top-0 z-30 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        {/* Top Row: Title, Badges, and Navigation Tabs */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 dark:bg-zinc-800 text-emerald-400 flex items-center justify-center border border-zinc-700/60 shadow-sm">
              <Zap className="w-5 h-5 fill-emerald-400/20" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight font-sans">
                  GridWholesale <span className="font-semibold text-zinc-500 dark:text-zinc-400">| Wind Desk</span>
                </h1>
                <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
                  UK Day-Ahead
                </span>
                <span className="px-2 py-0.5 text-[11px] font-medium rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  Elexon BMRS
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Renewable Generation Forecasting & Day-Ahead Thermal Procurement (January 2026)
              </p>
            </div>
          </div>

          {/* Right side controls: Tabs & Theme Toggle */}
          <div className="flex items-center gap-3">
            {/* Tab Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-[#141417] p-1 rounded-lg border border-slate-200 dark:border-zinc-800">
              <button
                onClick={() => onTabChange('daily')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeTab === 'daily'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Day-Ahead Daily View
              </button>
              <button
                onClick={() => onTabChange('monthly')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeTab === 'monthly'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                January 2026 Benchmark
              </button>
            </div>

            {/* Dark / Light Mode Switcher */}
            <button
              onClick={onToggleTheme}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className="p-2 rounded-lg bg-slate-100 dark:bg-[#141417] text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border border-slate-200 dark:border-zinc-800 transition"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-700" />}
            </button>
          </div>
        </div>

        {/* Bottom Control Bar: Delivery Day, Decision Gate, Risk Profile */}
        <div className="mt-3.5 pt-3 border-t border-slate-200 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Delivery Date Picker */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#141417] px-3 py-1.5 rounded-md border border-slate-200 dark:border-zinc-800">
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-zinc-600 dark:text-zinc-400 font-medium">Delivery Day (D):</span>
              <select
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="bg-transparent text-zinc-900 dark:text-zinc-100 font-semibold focus:outline-none cursor-pointer"
              >
                {availableDates.map((d) => {
                  const dObj = new Date(d);
                  dObj.setDate(dObj.getDate() - 1);
                  const dMinus1 = dObj.toISOString().slice(0, 10);
                  return (
                    <option key={d} value={d} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
                      {d} (Decision D-1: {dMinus1})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Decision Date Indicator */}
            {decisionDate && (
              <div className="hidden sm:flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 bg-slate-50 dark:bg-[#101012] px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-zinc-800/60">
                <span>Decision Day (D-1):</span>
                <span className="text-zinc-900 dark:text-zinc-200 font-mono font-medium">{decisionDate}</span>
              </div>
            )}

            {/* Gate Closure Cutoff Hour Selector */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#141417] px-3 py-1.5 rounded-md border border-slate-200 dark:border-zinc-800">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-zinc-600 dark:text-zinc-400 font-medium">D-1 Gate Cutoff:</span>
              <select
                value={gateClosureHour}
                onChange={(e) => onGateClosureChange(Number(e.target.value))}
                className="bg-transparent text-zinc-900 dark:text-zinc-100 font-semibold focus:outline-none cursor-pointer"
              >
                <option value={9} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">09:00 UTC (Early Auction)</option>
                <option value={11} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">11:00 UTC (Standard Day-Ahead)</option>
                <option value={12} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">12:00 UTC (EPEX SPOT UK Gate)</option>
                <option value={14} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">14:00 UTC (Late Afternoon)</option>
              </select>
            </div>

            {/* Risk Percentile Selector */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#141417] px-3 py-1.5 rounded-md border border-slate-200 dark:border-zinc-800">
              <ShieldAlert className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span className="text-zinc-600 dark:text-zinc-400 font-medium">Safety Buffer:</span>
              <select
                value={riskProfile}
                onChange={(e) => onRiskProfileChange(e.target.value)}
                className="bg-transparent text-zinc-900 dark:text-zinc-100 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="P90" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">P90 (Conservative Hedge)</option>
                <option value="P75" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">P75 (Balanced)</option>
                <option value="P50" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">P50 (Median Baseline)</option>
              </select>
            </div>
          </div>

          {/* Gate status pill */}
          <div className="hidden lg:flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Auction Cutoff: </span>
            <span className="font-mono text-zinc-700 dark:text-zinc-300 font-medium">
              {gateCutoffIso ? `${gateCutoffIso.slice(11, 16)} UTC on D-1` : '11:00 UTC D-1'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
