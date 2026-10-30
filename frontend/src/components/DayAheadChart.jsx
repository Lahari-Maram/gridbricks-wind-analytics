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
import { Info, HelpCircle, Layers } from 'lucide-react';

export default function DayAheadChart({ periods, deliveryDate, onSelectPeriod }) {
  const [viewMode, setViewMode] = useState('generation'); // 'generation' | 'procurement' | 'error'

  if (!periods || periods.length === 0) return null;

  // Format data for Recharts
  const chartData = periods.map((p) => ({
    sp: p.settlement_period,
    time: p.time_label,
    actual: p.actual_generation_mw,
    forecast: p.forecast_generation_mw,
    demand: p.consumer_demand_mw,
    thermalRequired: p.net_residual_thermal_required_mw,
    error: p.error_mw,
    // Positive error = Overforecast (red deficit risk)
    // Negative error = Underforecast (amber surplus)
    overforecastError: p.error_mw > 0 ? p.error_mw : 0,
    underforecastError: p.error_mw < 0 ? p.error_mw : 0,
    publishTime: p.forecast_publish_time
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isOver = data.error > 0;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs z-50">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
            <span className="font-bold text-white">Period {data.sp} ({data.time} UTC)</span>
            <span className="text-[10px] text-slate-400 font-mono">D-1 Gate Forecast</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-4">
              <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                Actual Wind (FUELHH):
              </span>
              <span className="font-mono font-bold text-white">
                {data.actual !== null ? `${data.actual.toLocaleString()} MW` : 'N/A'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-sky-400 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400 inline-block"></span>
                Gate Forecast (WINDFOR):
              </span>
              <span className="font-mono font-bold text-white">
                {data.forecast.toLocaleString()} MW
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-800">
              <span className={`font-medium ${isOver ? 'text-rose-400' : 'text-amber-400'}`}>
                Forecast Error:
              </span>
              <span className={`font-mono font-bold ${isOver ? 'text-rose-400' : 'text-amber-400'}`}>
                {data.error > 0 ? `+${data.error}` : data.error} MW
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-300">Net Thermal To Procure:</span>
              <span className="font-mono font-semibold text-amber-300">
                {data.thermalRequired.toLocaleString()} MW
              </span>
            </div>
          </div>

          <div className="mt-2.5 pt-1.5 border-t border-slate-800 text-[10px] text-sky-400/80 italic text-center">
            Click this period on chart to inspect forecast evolution history
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
      {/* Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white">
              Day-Ahead Half-Hourly Profile (48 Settlement Periods)
            </h2>
            <span className="text-xs text-slate-400 font-mono">| {deliveryDate}</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Comparing metered actuals (FUELHH: WIND) against latest forecast available at D-1 decision gate
          </p>
        </div>

        {/* Mode buttons */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 self-start sm:self-auto text-xs">
          <button
            onClick={() => setViewMode('generation')}
            className={`px-3 py-1 rounded-md font-medium transition ${
              viewMode === 'generation' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Wind Actual vs Forecast
          </button>
          <button
            onClick={() => setViewMode('procurement')}
            className={`px-3 py-1 rounded-md font-medium transition ${
              viewMode === 'procurement' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Residual Thermal Demand
          </button>
          <button
            onClick={() => setViewMode('error')}
            className={`px-3 py-1 rounded-md font-medium transition ${
              viewMode === 'error' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
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
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              interval={3}
            />
            <YAxis
              stroke="#64748b"
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
            <ReferenceLine y={0} stroke="#334155" />

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
                  stroke="#38bdf8"
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
                  stroke="#38bdf8"
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

      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-sky-400" />
          Click any point to inspect the forecast evolution across earlier publish times.
        </span>
        <span>Resolution: 30 minutes | 48 Settlement Periods (UK Standard)</span>
      </div>
    </div>
  );
}
