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
import { BarChart2, Calendar, TrendingDown, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';
import { fetchMonthlySummary } from '../services/api';

export default function MonthlyAnalyticsTab({ gateClosureHour, onSelectDay }) {
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
      <div className="py-20 text-center text-slate-400 text-sm">
        Calculating full January 2026 benchmark metrics across all settlement periods...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-12 text-center text-rose-400 text-sm">
        {error || 'Failed to load monthly summary'}
      </div>
    );
  }

  const { monthly_metrics, period_profiles, daily_summaries } = data;

  return (
    <div className="space-y-6">
      {/* Monthly Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            January 2026 Monthly MAE
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">
              {monthly_metrics.mae_mw.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">MW</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Aggregate across all 31 delivery days (1,488 half-hours)
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            January 2026 RMSE & MAPE
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">
              {monthly_metrics.rmse_mw.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">MW</span>
            <span className="text-xs text-purple-400 font-semibold ml-auto font-mono">
              {monthly_metrics.mape_percent}% MAPE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Standard measure of forecast volatility
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Net Monthly Forecast Bias
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono ${
              monthly_metrics.mean_bias_error_mw > 0 ? 'text-rose-400' : 'text-amber-400'
            }`}>
              {monthly_metrics.mean_bias_error_mw > 0 ? `+${monthly_metrics.mean_bias_error_mw}` : monthly_metrics.mean_bias_error_mw}
            </span>
            <span className="text-xs text-slate-400">MW</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {monthly_metrics.mean_bias_error_mw > 0 
              ? 'Tendency to over-forecast (creates real-time short position)' 
              : 'Tendency to under-forecast (creates long surplus position)'}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Energy Procured vs Actual
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-sky-400 font-mono">
              {(monthly_metrics.total_forecast_energy_mwh / 1000).toFixed(1)}k
            </span>
            <span className="text-xs text-slate-400">GWh Fc</span>
            <span className="text-xs text-emerald-400 font-semibold ml-auto font-mono">
              {(monthly_metrics.total_actual_energy_mwh / 1000).toFixed(1)}k GWh Act
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Total wind energy generated across Great Britain
          </p>
        </div>
      </div>

      {/* Diurnal Error Profile across the 48 Settlement Periods */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-base font-bold text-white">
              Diurnal Accuracy Profile Across 48 Settlement Periods (January Average)
            </h3>
            <p className="text-xs text-slate-400">
              Reveals systematic error patterns by time of day (e.g. morning vs evening ramp-up)
            </p>
          </div>
        </div>

        <div className="h-72 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={period_profiles} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="time_label" stroke="#64748b" fontSize={11} interval={3} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} unit=" MW" tickLine={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const p = payload[0].payload;
                    return (
                      <div className="bg-slate-900 border border-slate-700 p-2.5 rounded shadow text-xs">
                        <div className="font-bold text-white">
                          Period {p.settlement_period} ({p.time_label} UTC)
                        </div>
                        <div className="mt-1 text-sky-300">Avg MAE: {p.mae_mw} MW</div>
                        <div className={p.bias_mw > 0 ? 'text-rose-400' : 'text-amber-400'}>
                          Avg Bias: {p.bias_mw > 0 ? `+${p.bias_mw}` : p.bias_mw} MW
                        </div>
                        <div className="text-slate-400">Avg Actual: {p.avg_actual_mw} MW</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="mae_mw" name="Average MAE (MW)" fill="#0ea5e9" radius={[3, 3, 0, 0]} />
              <Line dataKey="bias_mw" name="Average Bias (MW)" stroke="#f43f5e" strokeWidth={2} dot={false} />
              <ReferenceLine y={0} stroke="#475569" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Performance Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <h3 className="text-base font-bold text-white mb-2">
          Daily Purchase Decisions Benchmark Table (January 1 - January 31, 2026)
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Click any day to drill down into its 48 settlement periods on the Day-Ahead Daily View.
        </p>

        <div className="overflow-x-auto border border-slate-800 rounded-lg max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800 z-10">
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
            <tbody className="divide-y divide-slate-800 font-mono">
              {daily_summaries.map((day) => {
                const isOver = day.bias_mw > 150;
                const isUnder = day.bias_mw < -150;
                return (
                  <tr key={day.delivery_date} className="hover:bg-slate-800/40 transition">
                    <td className="py-2 px-3 font-bold text-white">{day.delivery_date}</td>
                    <td className="py-2 px-3 text-slate-400">{day.decision_date}</td>
                    <td className="py-2 px-3 font-semibold text-sky-300">
                      {day.mae_mw.toLocaleString()} MW
                    </td>
                    <td className="py-2 px-3 text-slate-300">
                      {day.rmse_mw.toLocaleString()} MW
                    </td>
                    <td className="py-2 px-3 font-semibold">
                      <span className={isOver ? 'text-rose-400' : isUnder ? 'text-amber-400' : 'text-emerald-400'}>
                        {day.bias_mw > 0 ? `+${day.bias_mw}` : day.bias_mw} MW
                      </span>
                    </td>
                    <td className="py-2 px-3 text-emerald-400">
                      {day.avg_actual_mw.toLocaleString()} MW
                    </td>
                    <td className="py-2 px-3">
                      {isOver && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-950 text-rose-300 border border-rose-800">
                          Overforecast Deficit
                        </span>
                      )}
                      {isUnder && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-950 text-amber-300 border border-amber-800">
                          Underforecast Surplus
                        </span>
                      )}
                      {!isOver && !isUnder && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800">
                          Well Calibrated
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => onSelectDay(day.delivery_date)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-sky-900/40 hover:bg-sky-600 text-sky-300 hover:text-white transition text-[11px]"
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
