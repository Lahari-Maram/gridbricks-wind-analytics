import React from 'react';
import { Calendar, Clock, ShieldAlert, Zap, TrendingUp, BarChart3 } from 'lucide-react';

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
  gateCutoffIso
}) {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Top Row: Title, Badges, and Navigation Tabs */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-sky-500 to-blue-700 rounded-xl shadow-md flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  GridWholesale <span className="text-sky-400 font-semibold">| Wind Analytics</span>
                </h1>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-sky-950 text-sky-400 border border-sky-800">
                  UK Day-Ahead Desk
                </span>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Elexon BMRS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Renewable Wind Forecast Evaluation & Residual Thermal Procurement Engine (January 2026)
              </p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onTabChange('daily')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'daily'
                  ? 'bg-sky-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Day-Ahead Daily View
            </button>
            <button
              onClick={() => onTabChange('monthly')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'monthly'
                  ? 'bg-sky-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              January 2026 Benchmark
            </button>
          </div>
        </div>

        {/* Bottom Control Bar: Delivery Day, Decision Gate, Risk Profile */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            {/* Delivery Date Picker */}
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              <Calendar className="w-4 h-4 text-sky-400" />
              <span className="text-slate-400 font-medium">Delivery Day (D):</span>
              <select
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
              >
                {availableDates.map((d) => (
                  <option key={d} value={d} className="bg-slate-900 text-white">
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Decision Date Indicator */}
            {decisionDate && (
              <div className="hidden sm:flex items-center gap-1.5 text-slate-400 bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800/60">
                <span className="text-slate-500">Decision Day (D-1):</span>
                <span className="text-slate-200 font-mono font-medium">{decisionDate}</span>
              </div>
            )}

            {/* Gate Closure Cutoff Hour Selector */}
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-slate-400 font-medium">D-1 Gate Cutoff:</span>
              <select
                value={gateClosureHour}
                onChange={(e) => onGateClosureChange(Number(e.target.value))}
                className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
              >
                <option value={9} className="bg-slate-900 text-white">09:00 UTC (Early Auction)</option>
                <option value={11} className="bg-slate-900 text-white">11:00 UTC (Standard Day-Ahead)</option>
                <option value={12} className="bg-slate-900 text-white">12:00 UTC (EPEX SPOT UK Gate)</option>
                <option value={14} className="bg-slate-900 text-white">14:00 UTC (Late Afternoon)</option>
              </select>
            </div>

            {/* Risk Percentile Selector */}
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-400 font-medium">Procurement Buffer:</span>
              <select
                value={riskProfile}
                onChange={(e) => onRiskProfileChange(e.target.value)}
                className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
              >
                <option value="P90" className="bg-slate-900 text-white">P90 (Conservative / Low Deficit Risk)</option>
                <option value="P75" className="bg-slate-900 text-white">P75 (Balanced)</option>
                <option value="P50" className="bg-slate-900 text-white">P50 (Median Baseline)</option>
              </select>
            </div>
          </div>

          {/* Quick Status Pill */}
          <div className="hidden lg:flex items-center gap-2 text-slate-400">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Decision Gate Active: </span>
            <span className="font-mono text-slate-300 font-medium">
              {gateCutoffIso ? `${gateCutoffIso.slice(11, 16)} UTC on D-1` : '11:00 UTC D-1'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
