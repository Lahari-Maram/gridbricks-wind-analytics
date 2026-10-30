import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { Info } from 'lucide-react';

export default function DayAheadChart({ periods, deliveryDate, onSelectPeriod, isDarkMode }) {
  const [viewMode, setViewMode] = useState('generation');

  if (!periods || periods.length === 0) return null;

  const chartData = periods.map((p) => ({
    sp: p.settlement_period,
    time: p.time_label,
    actual: p.actual_generation_mw,
    forecast: p.forecast_generation_mw,
    demand: p.consumer_demand_mw,
    thermalRequired: p.net_residual_thermal_required_mw,
    error: p.error_mw,
    overforecastError: p.error_mw > 0 ? p.error_mw : 0,
    underforecastError: p.error_mw < 0 ? p.error_mw : 0,
    publishTime: p.forecast_publish_time
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isOver = data.error > 0;
      return (
        <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-700 p-3 rounded-lg shadow-xl text-xs z-50 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-1.5 mb-2">
            <span className="font-bold text-zinc-900 dark:text-zinc-100">Period {data.sp} ({data.time} UTC)</span>
            <span className="text-[10px] text-zinc-500 font-mono">D-1 Gate Forecast</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-4">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                Actual Wind (FUELHH):
              </span>
              <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                {data.actual !== null ? `${data.actual.toLocaleString()} MW` : 'N/A'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-sky-600 dark:text-sky-400 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-500 inline-block"></span>
                Gate Forecast (WINDFOR):
              </span>
              <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                {data.forecast.toLocaleString()} MW
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-200 dark:border-zinc-800">
              <span className={`font-medium ${isOver ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                Forecast Error:
              </span>
              <span className={`font-mono font-bold ${isOver ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {data.error > 0 ? `+${data.error}` : data.error} MW
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-zinc-600 dark:text-zinc-400">Net Thermal To Procure:</span>
              <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">
                {data.thermalRequired.toLocaleString()} MW
              </span>
            </div>
          </div>

          <div className="mt-2.5 pt-1.5 border-t border-slate-200 dark:border-zinc-800 text-[10px] text-zinc-500 italic text-center">
            Click this period on chart to inspect publication history
          </div>
        </div>
      );
    }
    return null;
  };

  const gridColor = isDarkMode ? '#27272a' : '#e2e8f0';
  const axisColor = isDarkMode ? '#71717a' : '#94a3b8';

  return (
    <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm transition">
      {/* Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Day-Ahead Half-Hourly Profile (48 Settlement Periods)
            </h2>
            <span className="text-xs text-zinc-500 font-mono">| {deliveryDate}</span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Comparing metered actuals (FUELHH: WIND) against latest forecast available at D-1 decision gate
          </p>
        </div>

        {/* Mode buttons */}
        <div className="flex items-center bg-slate-100 dark:bg-[#18181b] p-1 rounded-lg border border-slate-200 dark:border-zinc-800 self-start sm:self-auto text-xs font-medium">
          <button
            onClick={() => setViewMode('generation')}
            className={`px-3 py-1 rounded-md transition ${
              viewMode === 'generation'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Wind Actual vs Forecast
          </button>
          <button
            onClick={() => setViewMode('procurement')}
            className={`px-3 py-1 rounded-md transition ${
              viewMode === 'procurement'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Residual Thermal Demand
          </button>
          <button
            onClick={() => setViewMode('error')}
            className={`px-3 py-1 rounded-md transition ${
              viewMode === 'error'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Error Delta (MW)
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            onClick={(state) => {
              if (state && state.activePayload && state.activePayload.length) {
                const sp = state.activePayload[0].payload.sp;
                if (onSelectPeriod) onSelectPeriod(sp);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis
              dataKey="time"
              stroke={axisColor}
              fontSize={11}
              tickLine={false}
              interval={3}
            />
            <YAxis
              stroke={axisColor}
              fontSize={11}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              unit=" MW"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              iconType="circle"
            />
            <ReferenceLine y={0} stroke={gridColor} />

            {viewMode === 'generation' && (
              <>
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Actual Wind Generation (FUELHH)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  name="D-1 Gate Forecast (WINDFOR)"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </>
            )}

            {viewMode === 'procurement' && (
              <>
                <Line
                  type="monotone"
                  dataKey="demand"
                  name="Total Consumer Demand"
                  stroke="#94a3b8"
                  strokeWidth={1.5}
                  strokeDasharray="2 2"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="thermalRequired"
                  name="Residual Thermal Procurement Required"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  name="Expected Wind Generation"
                  stroke="#0284c7"
                  strokeWidth={2}
                  dot={false}
                />
              </>
            )}

            {viewMode === 'error' && (
              <>
                <Bar
                  dataKey="overforecastError"
                  name="Overforecast (Deficit Risk MW)"
                  fill="#f43f5e"
                  radius={[3, 3, 0, 0]}
                />
                <Bar
                  dataKey="underforecastError"
                  name="Underforecast (Surplus Spill MW)"
                  fill="#f59e0b"
                  radius={[0, 0, 3, 3]}
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-zinc-400" />
          Click any point to inspect the forecast evolution across earlier publish times.
        </span>
        <span>Resolution: 30 minutes | 48 Settlement Periods (UK Standard)</span>
      </div>
    </div>
  );
}
