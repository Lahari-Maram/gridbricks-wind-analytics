import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import MetricCards from './components/MetricCards';
import ProcurementAdvisor from './components/ProcurementAdvisor';
import DayAheadChart from './components/DayAheadChart';
import SettlementHeatmap from './components/SettlementHeatmap';
import DataInspectorTable from './components/DataInspectorTable';
import MonthlyAnalyticsTab from './components/MonthlyAnalyticsTab';
import ForecastEvolutionModal from './components/ForecastEvolutionModal';
import { fetchAvailableDates, fetchDayAheadData } from './services/api';
import { AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';

export default function App() {
  const [selectedDate, setSelectedDate] = useState('2026-01-15');
  const [availableDates, setAvailableDates] = useState(['2026-01-15']);
  const [gateClosureHour, setGateClosureHour] = useState(11);
  const [riskProfile, setRiskProfile] = useState('P90');
  const [activeTab, setActiveTab] = useState('daily');
  const [selectedPeriodForEvolution, setSelectedPeriodForEvolution] = useState(null);

  // Theme Management (Defaults to Dark Mode, persists in localStorage)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return true; // Default to sleek obsidian dark mode
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  const [dayAheadData, setDayAheadData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load available dates once on mount
  useEffect(() => {
    fetchAvailableDates()
      .then((res) => {
        if (res.dates && res.dates.length > 0) {
          setAvailableDates(res.dates);
          if (!res.dates.includes(selectedDate)) {
            setSelectedDate(res.dates[0]);
          }
        }
      })
      .catch((err) => {
        console.warn('Using default date list:', err);
      });
  }, []);

  // Fetch day-ahead data whenever date, gateClosureHour, or riskProfile changes
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchDayAheadData(selectedDate, gateClosureHour, riskProfile)
      .then((data) => {
        setDayAheadData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [selectedDate, gateClosureHour, riskProfile]);

  const handleSelectDayFromMonthly = (dateStr) => {
    setSelectedDate(dateStr);
    setActiveTab('daily');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      <Header
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        availableDates={availableDates}
        gateClosureHour={gateClosureHour}
        onGateClosureChange={setGateClosureHour}
        riskProfile={riskProfile}
        onRiskProfileChange={setRiskProfile}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        decisionDate={dayAheadData?.decision_date}
        gateCutoffIso={dayAheadData?.gate_closure_cutoff}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
              <div className="text-xs">
                <strong className="font-semibold">Error Loading Market Data: </strong>
                {error}
              </div>
            </div>
            <button
              onClick={() => {
                setLoading(true);
                fetchDayAheadData(selectedDate, gateClosureHour, riskProfile)
                  .then(setDayAheadData)
                  .finally(() => setLoading(false));
              }}
              className="px-3 py-1 bg-rose-100 hover:bg-rose-200 dark:bg-rose-900 dark:hover:bg-rose-800 text-xs font-semibold rounded-lg border border-rose-300 dark:border-rose-700 transition"
            >
              Retry
            </button>
          </div>
        )}

        {activeTab === 'daily' && (
          <div className="space-y-6">
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center text-zinc-500">
                <RefreshCw className="w-8 h-8 animate-spin text-zinc-600 dark:text-zinc-400 mb-3" />
                <span className="text-sm font-semibold">
                  Loading Elexon Day-Ahead Forecasts & Metered Actuals for {selectedDate}...
                </span>
                <span className="text-xs text-zinc-500 mt-1 font-mono">
                  Filtering WINDFOR publishTime &le; {gateClosureHour}:00 UTC on D-1
                </span>
              </div>
            ) : dayAheadData ? (
              <>
                {/* 1. Quantitative Accuracy KPI Cards */}
                <MetricCards
                  metrics={dayAheadData.metrics}
                  procurementAdvice={dayAheadData.procurement_advice}
                />

                {/* 2. Thermal Procurement & Cashout Advisor */}
                <ProcurementAdvisor
                  procurementAdvice={dayAheadData.procurement_advice}
                  metrics={dayAheadData.metrics}
                />

                {/* 3. Main Dual Time-Series Chart */}
                <DayAheadChart
                  periods={dayAheadData.periods}
                  deliveryDate={selectedDate}
                  onSelectPeriod={(sp) => setSelectedPeriodForEvolution(sp)}
                  isDarkMode={isDarkMode}
                />

                {/* 4. 48 Settlement Periods Heatmap */}
                <SettlementHeatmap
                  periods={dayAheadData.periods}
                  onSelectPeriod={(sp) => setSelectedPeriodForEvolution(sp)}
                />

                {/* 5. Complete Half-Hour Data Inspector Table with CSV Export */}
                <DataInspectorTable
                  periods={dayAheadData.periods}
                  deliveryDate={selectedDate}
                  onSelectPeriod={(sp) => setSelectedPeriodForEvolution(sp)}
                />
              </>
            ) : null}
          </div>
        )}

        {activeTab === 'monthly' && (
          <MonthlyAnalyticsTab
            gateClosureHour={gateClosureHour}
            onSelectDay={handleSelectDayFromMonthly}
            isDarkMode={isDarkMode}
          />
        )}
      </main>

      {/* Forecast Evolution Modal (traces historical revisions up to gate closure) */}
      <ForecastEvolutionModal
        isOpen={selectedPeriodForEvolution !== null}
        onClose={() => setSelectedPeriodForEvolution(null)}
        deliveryDate={selectedDate}
        settlementPeriod={selectedPeriodForEvolution}
        gateClosureHour={gateClosureHour}
      />

      {/* Production Institutional Footer */}
      <footer className="bg-white dark:bg-[#0c0c0e] border-t border-slate-200 dark:border-zinc-800/80 py-5 text-xs text-zinc-500 dark:text-zinc-400 mt-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">GridWholesale Trading Platform</span>
            <span>&bull;</span>
            <span>January 2026 UK Wholesale Power Procurement</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href="https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream"
              target="_blank"
              rel="noreferrer"
              className="hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 transition"
            >
              Elexon FUELHH (WIND) <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream"
              target="_blank"
              rel="noreferrer"
              className="hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 transition"
            >
              Elexon WINDFOR (Forecasts) <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-zinc-400 dark:text-zinc-600">|</span>
            <span>Auction Gate: 11:00 UTC D-1</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
