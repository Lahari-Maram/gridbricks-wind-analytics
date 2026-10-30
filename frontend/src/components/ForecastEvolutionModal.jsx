import React, { useEffect, useState } from 'react';
import { X, Clock, CheckCircle2 } from 'lucide-react';
import { fetchForecastEvolution } from '../services/api';

export default function ForecastEvolutionModal({
  isOpen,
  onClose,
  deliveryDate,
  settlementPeriod,
  gateClosureHour
}) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && settlementPeriod) {
      setLoading(true);
      setError(null);
      fetchForecastEvolution(deliveryDate, settlementPeriod, gateClosureHour)
        .then((res) => {
          setData(res);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [isOpen, deliveryDate, settlementPeriod, gateClosureHour]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto transition">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-zinc-800 pb-4 mb-4">
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Forecast Evolution Timeline | Period {settlementPeriod}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Delivery Date: {deliveryDate} &bull; Target Start: {data?.target_start_time ? data.target_start_time.slice(11, 16) : ''} UTC
            </p>
          </div>
        </div>

        {loading && (
          <div className="py-12 text-center text-zinc-500 dark:text-zinc-400 text-sm">
            Loading forecast publication history...
          </div>
        )}

        {error && (
          <div className="py-6 text-center text-rose-600 dark:text-rose-400 text-sm">
            {error}
          </div>
        )}

        {data && !loading && (
          <div className="space-y-5">
            {/* Key Metric Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 dark:bg-[#18181b] p-3 rounded-lg border border-slate-200 dark:border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase font-semibold">Actual Metered Wind</span>
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                  {data.actual_generation_mw !== null ? `${data.actual_generation_mw.toLocaleString()} MW` : 'N/A'}
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-[#18181b] p-3 rounded-lg border border-slate-300 dark:border-zinc-700">
                <span className="text-[10px] text-sky-600 dark:text-sky-400 uppercase font-semibold">D-1 Gate Forecast</span>
                <div className="text-lg font-bold text-sky-600 dark:text-sky-400 font-mono mt-0.5">
                  {data.latest_gate_forecast_mw.toLocaleString()} MW
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-[#18181b] p-3 rounded-lg border border-slate-200 dark:border-zinc-800 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-zinc-500 uppercase font-semibold">Gate Closure Cutoff</span>
                <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 font-mono mt-1">
                  {data.gate_closure_time.slice(11, 16)} UTC on D-1
                </div>
              </div>
            </div>

            {/* Evolution Table */}
            <div>
              <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                WINDFOR Publication History For This Settlement Period
              </h4>
              <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-slate-50 dark:bg-[#18181b]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-[#121215] text-zinc-600 dark:text-zinc-400 font-semibold border-b border-slate-200 dark:border-zinc-800">
                    <tr>
                      <th className="py-2.5 px-3">Publish Time (UTC)</th>
                      <th className="py-2.5 px-3">Forecast (MW)</th>
                      <th className="py-2.5 px-3">Lead Time</th>
                      <th className="py-2.5 px-3">Market Eligibility</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-zinc-800/80 font-mono">
                    {data.evolution.map((pt, idx) => (
                      <tr
                        key={idx}
                        className={pt.is_at_or_before_gate ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : 'opacity-70'}
                      >
                        <td className="py-2 px-3 text-zinc-700 dark:text-zinc-300">
                          {pt.publish_time.replace('T', ' ').replace('Z', '')}
                        </td>
                        <td className="py-2 px-3 font-bold text-zinc-900 dark:text-white">
                          {pt.forecast_mw.toLocaleString()} MW
                        </td>
                        <td className="py-2 px-3 text-zinc-500 dark:text-zinc-400">
                          {pt.lead_time_hours} hrs out
                        </td>
                        <td className="py-2 px-3">
                          {pt.is_at_or_before_gate ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                              <CheckCircle2 className="w-3 h-3" /> Available at D-1 Gate
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500 bg-slate-200 dark:bg-zinc-800 px-2 py-0.5 rounded">
                              Post Gate Closure
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Insight Note */}
            <div className="p-3 rounded-lg bg-slate-100 dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              <span className="font-semibold text-zinc-900 dark:text-zinc-200">UK Market Rule Notice: </span>
              Under UK day-ahead wholesale market auction rules, bids must be submitted before gate closure (11:00 UTC D-1). Forecasts published after 11:00 UTC cannot be used for Day-Ahead auction bidding, even though they may be more accurate in real time.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
