import React from 'react';
import { Flame, ShieldCheck, DollarSign } from 'lucide-react';

export default function ProcurementAdvisor({ procurementAdvice, metrics }) {
  if (!procurementAdvice) return null;

  return (
    <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm transition">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-zinc-800 pb-3 mb-4 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-amber-600 dark:text-amber-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Day-Ahead Thermal Procurement Recommendation
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Quantified safety margin to hedge against wind forecast error & cashout penalties
            </p>
          </div>
        </div>

        <span className="text-xs font-mono font-medium px-2.5 py-1 rounded bg-slate-100 dark:bg-[#18181b] text-zinc-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700/60 self-start sm:self-auto">
          Target Gate: {procurementAdvice.gate_closure_cutoff.slice(11, 16)} UTC on D-1
        </span>
      </div>

      {/* Procurement Calculation Waterfall */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        {/* Step 1: Demand */}
        <div className="bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800/80 p-3 rounded-lg">
          <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase">1. Consumer Demand</span>
          <div className="mt-1 font-mono text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {procurementAdvice.total_demand_mwh.toLocaleString()}
          </div>
          <span className="text-[10px] text-zinc-500">MWh (24h Total)</span>
        </div>

        {/* Step 2: Wind Forecast */}
        <div className="bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800/80 p-3 rounded-lg">
          <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 uppercase">2. Expected Wind</span>
          <div className="mt-1 font-mono text-lg font-bold text-sky-600 dark:text-sky-400">
            - {procurementAdvice.expected_wind_generation_mwh.toLocaleString()}
          </div>
          <span className="text-[10px] text-zinc-500">MWh (D-1 Forecast)</span>
        </div>

        {/* Step 3: Base Thermal */}
        <div className="bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800/80 p-3 rounded-lg">
          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-500 uppercase">3. Base Thermal Req.</span>
          <div className="mt-1 font-mono text-lg font-bold text-amber-600 dark:text-amber-400">
            {procurementAdvice.base_thermal_procurement_mwh.toLocaleString()}
          </div>
          <span className="text-[10px] text-zinc-500">MWh (Unadjusted)</span>
        </div>

        {/* Step 4: Safety Buffer */}
        <div className="bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800/80 p-3 rounded-lg">
          <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 uppercase">
            4. {procurementAdvice.risk_profile} Error Buffer
          </span>
          <div className="mt-1 font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400">
            +{procurementAdvice.recommended_procurement_buffer_mw.toLocaleString()} MW
          </div>
          <span className="text-[10px] text-zinc-500">Tail risk hedge</span>
        </div>

        {/* Step 5: Recommended Order */}
        <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800/60 p-3 rounded-lg">
          <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-400 uppercase">5. Recommended Order</span>
          <div className="mt-1 font-mono text-lg font-bold text-amber-700 dark:text-amber-300">
            {procurementAdvice.recommended_thermal_procurement_mwh.toLocaleString()}
          </div>
          <span className="text-[10px] text-amber-700/80 dark:text-amber-500/80">MWh to buy Day-Ahead</span>
        </div>
      </div>

      {/* Financial Risk & Cashout Guidance */}
      <div className="bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-lg p-3.5 flex items-start gap-3 text-xs">
        <div className="p-1.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 mt-0.5 shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <div className="font-semibold text-zinc-900 dark:text-zinc-100">
            Trading Desk Strategy & Cashout Exposure Assessment:
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
            {procurementAdvice.financial_risk_summary}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-4 text-[11px] text-zinc-600 dark:text-zinc-400 pt-2 border-t border-slate-200 dark:border-zinc-800">
            <span>
              <strong>P10 Error:</strong>{' '}
              <span className="font-mono text-zinc-800 dark:text-zinc-200">{metrics.p10_error_mw} MW</span>
            </span>
            <span>
              <strong>Median (P50) Error:</strong>{' '}
              <span className="font-mono text-zinc-800 dark:text-zinc-200">{metrics.p50_error_mw} MW</span>
            </span>
            <span>
              <strong>P90 (Tail Risk):</strong>{' '}
              <span className="font-mono text-rose-600 dark:text-rose-400">+{metrics.p90_error_mw} MW</span>
            </span>
            <span className="text-zinc-500 italic">
              *Procuring at P90 cushions against 90% of observed wind underperformance events.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
