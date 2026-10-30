import React from 'react';
import { LayoutGrid } from 'lucide-react';

export default function SettlementHeatmap({ periods, onSelectPeriod }) {
  if (!periods || periods.length === 0) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm font-bold text-white">
            48 Settlement Periods Error Distribution (Half-Hour Resolution)
          </h3>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-rose-600 inline-block"></span> Overforecast (Deficit)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-amber-600 inline-block"></span> Underforecast (Surplus)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-emerald-600 inline-block"></span> Accurate (&lt;300 MW)
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-400 mb-3">
        Click any half-hour period below to examine its historical forecast revisions across previous publish times.
      </p>

      {/* Grid of 48 periods */}
      <div className="grid grid-cols-6 sm:grid-cols-12 md:grid-cols-16 lg:grid-cols-24 gap-1.5">
        {periods.map((p) => {
          const err = p.error_mw || 0;
          const absErr = Math.abs(err);
          
          let bgClass = 'bg-slate-800 text-slate-400 hover:bg-slate-700';
          let borderClass = 'border-slate-700';

          if (absErr < 300) {
            bgClass = 'bg-emerald-950/80 text-emerald-300 hover:bg-emerald-900';
            borderClass = 'border-emerald-800/60';
          } else if (err > 0) {
            // Overforecast
            if (absErr > 2000) {
              bgClass = 'bg-rose-900 text-rose-100 font-bold hover:bg-rose-800';
              borderClass = 'border-rose-600';
            } else {
              bgClass = 'bg-rose-950/80 text-rose-300 hover:bg-rose-900';
              borderClass = 'border-rose-800/60';
            }
          } else {
            // Underforecast
            if (absErr > 2000) {
              bgClass = 'bg-amber-900 text-amber-100 font-bold hover:bg-amber-800';
              borderClass = 'border-amber-600';
            } else {
              bgClass = 'bg-amber-950/80 text-amber-300 hover:bg-amber-900';
              borderClass = 'border-amber-800/60';
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
