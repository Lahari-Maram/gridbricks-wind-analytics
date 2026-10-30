/**
 * API client for GridWholesale Day-Ahead Wind Analytics.
 * Handles production URLs (Vercel/Heroku) and local Vite proxy.
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/api/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function fetchAvailableDates() {
  const res = await fetch(`${API_BASE}/api/dates`);
  if (!res.ok) throw new Error('Failed to fetch available dates');
  return res.json();
}

export async function fetchDayAheadData(date = '2026-01-15', gateClosureHour = 11, riskProfile = 'P90') {
  const url = `${API_BASE}/api/day-ahead?date=${encodeURIComponent(date)}&gate_closure_hour=${gateClosureHour}&risk_profile=${riskProfile}`;
  const res = await fetch(url);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to load day-ahead data: ${errorText}`);
  }
  return res.json();
}

export async function fetchMonthlySummary(month = '2026-01', gateClosureHour = 11) {
  const url = `${API_BASE}/api/metrics/monthly?month=${encodeURIComponent(month)}&gate_closure_hour=${gateClosureHour}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load monthly summary');
  return res.json();
}

export async function fetchForecastEvolution(date, settlementPeriod = 36, gateClosureHour = 11) {
  const url = `${API_BASE}/api/forecast-evolution?date=${encodeURIComponent(date)}&settlement_period=${settlementPeriod}&gate_closure_hour=${gateClosureHour}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load forecast evolution');
  return res.json();
}
