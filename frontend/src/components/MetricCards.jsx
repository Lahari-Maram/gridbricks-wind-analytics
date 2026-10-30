import React from 'react';
import { Activity, AlertTriangle, CheckCircle2, Gauge, Scale, Flame } from 'lucide-react';

export default function MetricCards({ metrics, procurementAdvice }) {
  if (!metrics) return null;

  const isOverforecast = metrics.mean_bias_error_mw > 150;
  const isUnderforecast = metrics.mean_bias_error_mw < -150;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: MAE */}
      <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm hover:border-slate-300 dark:hover:border-zinc-700 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Mean Absolute Error (MAE)
          </span>
          <div className="p-1.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-mono">
            {metrics.mae_mw.toLocaleString()}
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">MW</span>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Avg deviation per 30-min settlement period
        </p>
      </div>

      {/* Card 2: Volatility / RMSE / MAPE */}
      <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm hover:border-slate-300 dark:hover:border-zinc-700 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Volatility (RMSE / MAPE)
          </span>
          <div className="p-1.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
            <Gauge className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-mono">
            {metrics.rmse_mw.toLocaleString()}
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">MW</span>
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold ml-auto font-mono">
            {metrics.mape_percent}% MAPE
          </span>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Root mean squared error penalizing tail misses
        </p>
      </div>

      {/* Card 3: Systematic Bias (MBE) */}
      <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm hover:border-slate-300 dark:hover:border-zinc-700 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Systematic Bias (MBE)
          </span>
          <div className={`p-1.5 rounded-md ${
            isOverforecast 
              ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400' 
              : isUnderforecast 
              ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400' 
              : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400'
          }`}>
            <Scale className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className={`text-2xl font-bold font-mono ${
            isOverforecast 
              ? 'text-rose-600 dark:text-rose-400' 
              : isUnderforecast 
              ? 'text-amber-600 dark:text-amber-400' 
              : 'text-emerald-600 dark:text-emerald-400'
          }`}>
            {metrics.mean_bias_error_mw > 0 ? `+${metrics.mean_bias_error_mw}` : metrics.mean_bias_error_mw}
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">MW</span>
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          {isOverforecast && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-3 h-3" /> Overforecast (Deficit Risk)
            </span>
          )}
          {isUnderforecast && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-3 h-3" /> Underforecast (Spill Surplus)
            </span>
          )}
          {!isOverforecast && !isUnderforecast && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3 h-3" /> Well Calibrated
            </span>
          )}
        </div>
      </div>

      {/* Card 4: Procurement Safety Buffer */}
      <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm hover:border-slate-300 dark:hover:border-zinc-700 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Thermal Buffer ({procurementAdvice?.risk_profile || 'P90'})
          </span>
          <div className="p-1.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400">
            <Flame className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
            +{procurementAdvice?.recommended_procurement_buffer_mw?.toLocaleString() || 0}
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">MW</span>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Hedge buffer to protect against BM cashout penalty
        </p>
      </div>
    </div>
  );
}
