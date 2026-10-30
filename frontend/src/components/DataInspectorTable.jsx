import React, { useState } from 'react';
import { Download, Table, ArrowUpDown, Search, Eye } from 'lucide-react';

export default function DataInspectorTable({ periods, deliveryDate, onSelectPeriod }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('settlement_period');
  const [sortAsc, setSortAsc] = useState(true);

  if (!periods || periods.length === 0) return null;

  const filtered = periods.filter((p) => {
    return (
      p.time_label.includes(searchTerm) ||
      String(p.settlement_period).includes(searchTerm) ||
      (p.imbalance_risk && p.imbalance_risk.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  filtered.sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    if (valA === null || valA === undefined) valA = 0;
    if (valB === null || valB === undefined) valB = 0;
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const exportCsv = () => {
    const headers = [
      'SettlementPeriod',
      'TimeUTC',
      'ActualWindMW',
      'ForecastWindMW',
      'ErrorMW',
      'AbsErrorMW',
      'ErrorPct',
      'ConsumerDemandMW',
      'ResidualThermalRequiredMW',
      'ImbalanceStatus'
    ];

    const rows = periods.map((p) => [
      p.settlement_period,
      p.time_label,
      p.actual_generation_mw ?? '',
      p.forecast_generation_mw,
      p.error_mw ?? '',
      p.abs_error_mw ?? '',
      p.error_percentage ?? '',
      p.consumer_demand_mw,
      p.net_residual_thermal_required_mw,
      p.imbalance_risk ?? ''
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Elexon_Wind_DayAhead_${deliveryDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm transition">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Table className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Half-Hour Settlement Period Data Inspector (All 48 Periods)
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search time or period..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-100 dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
            />
          </div>

          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-200 dark:border-zinc-800 rounded-lg max-h-96 overflow-y-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 dark:bg-[#18181b] text-zinc-600 dark:text-zinc-400 sticky top-0 border-b border-slate-200 dark:border-zinc-800 z-10 select-none">
            <tr>
              <th
                onClick={() => handleSort('settlement_period')}
                className="py-2.5 px-3 cursor-pointer hover:text-zinc-900 dark:hover:text-white"
              >
                <div className="flex items-center gap-1">
                  <span>Period</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-3">Time (UTC)</th>
              <th
                onClick={() => handleSort('actual_generation_mw')}
                className="py-2.5 px-3 cursor-pointer hover:text-zinc-900 dark:hover:text-white"
              >
                <div className="flex items-center gap-1">
                  <span>Actual (FUELHH)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('forecast_generation_mw')}
                className="py-2.5 px-3 cursor-pointer hover:text-zinc-900 dark:hover:text-white"
              >
                <div className="flex items-center gap-1">
                  <span>D-1 Forecast</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('error_mw')}
                className="py-2.5 px-3 cursor-pointer hover:text-zinc-900 dark:hover:text-white"
              >
                <div className="flex items-center gap-1">
                  <span>Error (MW)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('error_percentage')}
                className="py-2.5 px-3 cursor-pointer hover:text-zinc-900 dark:hover:text-white"
              >
                <div className="flex items-center gap-1">
                  <span>Error %</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-3">Demand</th>
              <th className="py-2.5 px-3">Thermal Req.</th>
              <th className="py-2.5 px-3">Risk Assessment</th>
              <th className="py-2.5 px-3 text-center">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-zinc-800/80 font-mono">
            {filtered.map((p) => {
              const err = p.error_mw;
              const isOver = err !== null && err > 0;
              return (
                <tr key={p.settlement_period} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition">
                  <td className="py-2 px-3 font-bold text-zinc-900 dark:text-zinc-100">{p.settlement_period}</td>
                  <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">{p.time_label}</td>
                  <td className="py-2 px-3 font-semibold text-emerald-600 dark:text-emerald-400">
                    {p.actual_generation_mw !== null ? `${p.actual_generation_mw.toLocaleString()} MW` : 'N/A'}
                  </td>
                  <td className="py-2 px-3 text-sky-600 dark:text-sky-400">
                    {p.forecast_generation_mw.toLocaleString()} MW
                  </td>
                  <td className="py-2 px-3 font-semibold">
                    {err !== null ? (
                      <span className={isOver ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}>
                        {err > 0 ? `+${err.toLocaleString()}` : err.toLocaleString()} MW
                      </span>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td className="py-2 px-3 text-zinc-500">
                    {p.error_percentage !== null ? `${p.error_percentage}%` : 'N/A'}
                  </td>
                  <td className="py-2 px-3 text-zinc-700 dark:text-zinc-300">
                    {p.consumer_demand_mw.toLocaleString()} MW
                  </td>
                  <td className="py-2 px-3 font-semibold text-amber-600 dark:text-amber-400">
                    {p.net_residual_thermal_required_mw.toLocaleString()} MW
                  </td>
                  <td className="py-2 px-3">
                    {p.imbalance_risk === 'OVERFORECAST_DEFICIT' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                        Deficit Risk
                      </span>
                    )}
                    {p.imbalance_risk === 'UNDERFORECAST_SURPLUS' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        Surplus Spill
                      </span>
                    )}
                    {p.imbalance_risk === 'BALANCED' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        Balanced
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button
                      onClick={() => onSelectPeriod(p.settlement_period)}
                      className="p-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition"
                      title="Inspect publication history"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
