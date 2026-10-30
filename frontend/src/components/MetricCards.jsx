import React from 'react';
import { Activity, AlertTriangle, CheckCircle2, Gauge, Scale, Wind, Flame } from 'lucide-react';

export default function MetricCards({ metrics, procurementAdvice }) {
  if (!metrics) return null;

  const isOverforecast = metrics.mean_bias_error_mw > 150;
  const isUnderforecast = metrics.mean_bias_error_mw < -150;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: MAE */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Mean Absolute Error (MAE)
          </span>
          <div className="p-1.5 rounded-lg bg-sky-950 text-sky-400">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white font-mono">
            {metrics.mae_mw.toLocaleString()}
          </span>
          <span className="text-xs text-slate-400">MW</span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Avg deviation per 30-min settlement period
        </p>
      </div>

      {/* Card 2: RMSE & MAPE */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Volatility (RMSE / MAPE)
          </span>
          <div className="p-1.5 rounded-lg bg-purple-950 text-purple-400">
            <Gauge className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white font-mono">
            {metrics.rmse_mw.toLocaleString()}
          </span>
          <span className="text-xs text-slate-400">MW</span>
          <span className="text-xs text-purple-400 font-semibold ml-auto font-mono">
            {metrics.mape_percent}% MAPE
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Penalizes large tail ramp prediction errors
        </p>
      </div>

      {/* Card 3: Systematic Bias (MBE) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Systematic Bias (MBE)
          </span>
          <div className={`p-1.5 rounded-lg ${
            isOverforecast 
              ? 'bg-rose-950 text-rose-400' 
              : isUnderforecast 
              ? 'bg-amber-950 text-amber-400' 
              : 'bg-emerald-950 text-emerald-400'
          }`}>
            <Scale className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className={`text-2xl font-bold font-mono ${
            isOverforecast 
              ? 'text-rose-400' 
              : isUnderforecast 
              ? 'text-amber-400' 
              : 'text-emerald-400'
          }`}>
            {metrics.mean_bias_error_mw > 0 ? `+${metrics.mean_bias_error_mw}` : metrics.mean_bias_error_mw}
          </span>
          <span className="text-xs text-slate-400">MW</span>
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          {isOverforecast && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400">
              <AlertTriangle className="w-3 h-3" /> Overforecast (Deficit Risk)
            </span>
          )}
          {isUnderforecast && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400">
              <AlertTriangle className="w-3 h-3" /> Underforecast (Spill Surplus)
            </span>
          )}
          {!isOverforecast && !isUnderforecast && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
              <CheckCircle2 className="w-3 h-3" /> Balanced Calibration
            </span>
          )}
        </div>
      </div>

      {/* Card 4: Safety Procurement Buffer */}
      <div className="bg-gradient-to-br from-slate-900 to-sky-950/40 border border-sky-800/60 rounded-xl p-4 shadow-sm hover:border-sky-700 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-sky-300 uppercase tracking-wider">
            Thermal Buffer ({procurementAdvice?.risk_profile || 'P90'})
          </span>
          <div className="p-1.5 rounded-lg bg-sky-900/60 text-sky-300">
            <Flame className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-sky-200 font-mono">
            +{procurementAdvice?.recommended_procurement_buffer_mw?.toLocaleString() || 0}
          </span>
          <span className="text-xs text-sky-400">MW</span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Hedge buffer to prevent BM cashout penalty
        </p>
      </div>
    </div>
  );
}
