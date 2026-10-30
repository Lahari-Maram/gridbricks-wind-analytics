import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
  Line,
  ComposedChart
} from 'recharts';
import { ArrowRight } from 'lucide-react';
import { fetchMonthlySummary } from '../services/api';

export default function MonthlyAnalyticsTab({ gateClosureHour, onSelectDay, isDarkMode }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchMonthlySummary('2026-01', gateClosureHour)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [gateClosureHour]);

  if (loading) {
    return (
      <div className="py-20 text-center text-zinc-500 text-sm">
        Calculating full January 2026 benchmark metrics across all settlement periods...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-12 text-center text-rose-600 dark:text-rose-400 text-sm">
        {error || 'Failed to load monthly summary'}
      </div>
    );
  }

  const { monthly_metrics, period_profiles, daily_summaries } = data;
  const gridColor = isDarkMode ? '#27272a' : '#e2e8f0';
  const axisColor = isDarkMode ? '#71717a' : '#94a3b8';

  return (
    <div className="space-y-6">
      {/* Monthly Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            January 2026 Monthly MAE
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-mono">
              {monthly_metrics.mae_mw.toLocaleString()}
            </span>
            <span className="text-xs text-zinc-500 font-medium">MW</span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Aggregate across all 31 delivery days (1,488 half-hours)
          </p>
        </div>

        <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            January 2026 RMSE & MAPE
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-mono">
              {monthly_metrics.rmse_mw.toLocaleString()}
            </span>
            <span className="text-xs text-zinc-500 font-medium">MW</span>
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold ml-auto font-mono">
              {monthly_metrics.mape_percent}% MAPE
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Standard measure of forecast volatility
          </p>
        </div>

        <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Net Monthly Forecast Bias
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono ${
              monthly_metrics.mean_bias_error_mw > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
            }`}>
              {monthly_metrics.mean_bias_error_mw > 0 ? `+${monthly_metrics.mean_bias_error_mw}` : monthly_metrics.mean_bias_error_mw}
            </span>
            <span className="text-xs text-zinc-500 font-medium">MW</span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            {monthly_metrics.mean_bias_error_mw > 0 
              ? 'Tendency to over-forecast (creates real-time short position)' 
              : 'Tendency to under-forecast (creates long surplus position)'}
          </p>
        </div>

        <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Energy Procured vs Actual
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-sky-600 dark:text-sky-400 font-mono">
              {(monthly_metrics.total_forecast_energy_mwh / 1000).toFixed(1)}k
            </span>
            <span className="text-xs text-zinc-500">GWh Fc</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold ml-auto font-mono">
              {(monthly_metrics.total_actual_energy_mwh / 1000).toFixed(1)}k GWh Act
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Total wind energy generated across Great Britain
          </p>
        </div>
      </div>

      {/* Diurnal Error Profile across the 48 Settlement Periods */}
      <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Diurnal Accuracy Profile Across 48 Settlement Periods (January Average)
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Reveals systematic error patterns by time of day (e.g. morning vs evening ramp-up)
            </p>
          </div>
        </div>

        <div className="h-72 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={period_profiles} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="time_label" stroke={axisColor} fontSize={11} interval={3} tickLine={false} />
              <YAxis stroke={axisColor} fontSize={11} unit=" MW" tickLine={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const p = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-700 p-2.5 rounded shadow text-xs">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100">
                          Period {p.settlement_period} ({p.time_label} UTC)
                        </div>
                        <div className="mt-1 text-sky-600 dark:text-sky-400">Avg MAE: {p.mae_mw} MW</div>
                        <div className={p.bias_mw > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}>
                          Avg Bias: {p.bias_mw > 0 ? `+${p.bias_mw}` : p.bias_mw} MW
                        </div>
                        <div className="text-zinc-500">Avg Actual: {p.avg_actual_mw} MW</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="mae_mw" name="Average MAE (MW)" fill="#0ea5e9" radius={[3, 3, 0, 0]} />
              <Line dataKey="bias_mw" name="Average Bias (MW)" stroke="#f43f5e" strokeWidth={2} dot={false} />
              <ReferenceLine y={0} stroke={gridColor} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Performance Table */}
      <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
          Daily Purchase Decisions Benchmark Table (January 1 - January 31, 2026)
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
          Click any day to drill down into its 48 settlement periods on the Day-Ahead Daily View.
        </p>

        <div className="overflow-x-auto border border-slate-200 dark:border-zinc-800 rounded-lg max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-[#18181b] text-zinc-600 dark:text-zinc-400 sticky top-0 border-b border-slate-200 dark:border-zinc-800 z-10">
              <tr>
                <th className="py-2.5 px-3">Delivery Date (D)</th>
                <th className="py-2.5 px-3">Decision Date (D-1)</th>
                <th className="py-2.5 px-3">Daily MAE (MW)</th>
                <th className="py-2.5 px-3">Daily RMSE (MW)</th>
                <th className="py-2.5 px-3">Mean Bias (MW)</th>
                <th className="py-2.5 px-3">Avg Wind Gen (MW)</th>
                <th className="py-2.5 px-3">Risk Assessment</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-zinc-800/80 font-mono">
              {daily_summaries.map((day) => {
                const isOver = day.bias_mw > 150;
                const isUnder = day.bias_mw < -150;
                return (
                  <tr key={day.delivery_date} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition">
                    <td className="py-2 px-3 font-bold text-zinc-900 dark:text-zinc-100">{day.delivery_date}</td>
                    <td className="py-2 px-3 text-zinc-500">{day.decision_date}</td>
                    <td className="py-2 px-3 font-semibold text-sky-600 dark:text-sky-400">
                      {day.mae_mw.toLocaleString()} MW
                    </td>
                    <td className="py-2 px-3 text-zinc-700 dark:text-zinc-300">
                      {day.rmse_mw.toLocaleString()} MW
                    </td>
                    <td className="py-2 px-3 font-semibold">
                      <span className={isOver ? 'text-rose-600 dark:text-rose-400' : isUnder ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
                        {day.bias_mw > 0 ? `+${day.bias_mw}` : day.bias_mw} MW
                      </span>
                    </td>
                    <td className="py-2 px-3 text-emerald-600 dark:text-emerald-400">
                      {day.avg_actual_mw.toLocaleString()} MW
                    </td>
                    <td className="py-2 px-3">
                      {isOver && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          Overforecast Deficit
                        </span>
                      )}
                      {isUnder && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          Underforecast Surplus
                        </span>
                      )}
                      {!isOver && !isUnder && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          Well Calibrated
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => onSelectDay(day.delivery_date)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition text-[11px] font-semibold"
                      >
                        Inspect <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
