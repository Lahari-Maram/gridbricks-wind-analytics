import React from 'react';
import { LayoutGrid } from 'lucide-react';

export default function SettlementHeatmap({ periods, onSelectPeriod }) {
  if (!periods || periods.length === 0) return null;

  return (
    <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm transition">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            48 Settlement Periods Error Distribution (Half-Hour Resolution)
          </h3>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-zinc-600 dark:text-zinc-400">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block"></span> Overforecast (Deficit)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block"></span> Underforecast (Surplus)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span> Calibrated (&lt;300 MW)
          </span>
        </div>
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
        Click any half-hour period below to examine its historical forecast revisions across previous publish times.
      </p>

      {/* Grid of 48 periods */}
      <div className="grid grid-cols-6 sm:grid-cols-12 md:grid-cols-16 lg:grid-cols-24 gap-1.5">
        {periods.map((p) => {
          const err = p.error_mw || 0;
          const absErr = Math.abs(err);
          
          let bgClass = 'bg-slate-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700';
          let borderClass = 'border-slate-200 dark:border-zinc-700/60';

          if (absErr < 300) {
            bgClass = 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60';
            borderClass = 'border-emerald-200 dark:border-emerald-800/60';
          } else if (err > 0) {
            // Overforecast
            if (absErr > 2000) {
              bgClass = 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 font-bold hover:bg-rose-200 dark:hover:bg-rose-900';
              borderClass = 'border-rose-300 dark:border-rose-700';
            } else {
              bgClass = 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60';
              borderClass = 'border-rose-200 dark:border-rose-800/60';
            }
          } else {
            // Underforecast
            if (absErr > 2000) {
              bgClass = 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 font-bold hover:bg-amber-200 dark:hover:bg-amber-900';
              borderClass = 'border-amber-300 dark:border-amber-700';
            } else {
              bgClass = 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60';
              borderClass = 'border-amber-200 dark:border-amber-800/60';
            }
          }

          return (
            <button
              key={p.settlement_period}
              onClick={() => onSelectPeriod(p.settlement_period)}
              title={`SP ${p.settlement_period} (${p.time_label} UTC)\nActual: ${p.actual_generation_mw} MW\nForecast: ${p.forecast_generation_mw} MW\nError: ${err > 0 ? '+' : ''}${err} MW`}
              className={`p-1.5 rounded flex flex-col items-center justify-center border text-center transition ${bgClass} ${borderClass}`}
            >
              <span className="text-[10px] font-mono leading-none opacity-80">
                {p.time_label}
              </span>
              <span className="text-[11px] font-mono font-bold mt-0.5 leading-none">
                {p.settlement_period}
              </span>
              <span className="text-[9px] font-mono mt-1 opacity-90 leading-none">
                {err > 0 ? `+${(err / 1000).toFixed(1)}k` : `${(err / 1000).toFixed(1)}k`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
