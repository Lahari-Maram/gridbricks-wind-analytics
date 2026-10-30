"""
Quantitative Metrics Engine: Calculates MAE, RMSE, MAPE, Mean Bias Error (MBE),
percentiles (P10/P50/P90), and thermal procurement recommendations with risk buffers.
"""

import math
import numpy as np
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from app.models.schemas import (
    SettlementPeriodItem, AccuracyMetrics, ThermalProcurementAdvice,
    PeriodProfileItem, DailySummaryItem, MonthSummaryResponse
)
from app.services.data_processor import data_processor, format_sp_time
from app.services.elexon_client import elexon_client

class MetricsEngine:
    def compute_accuracy_metrics(self, periods: List[SettlementPeriodItem]) -> AccuracyMetrics:
        """
        Calculates MAE, RMSE, MAPE, Mean Bias Error, and percentiles for a set of settlement periods.
        """
        valid_items = [p for p in periods if p.actual_generation_mw is not None]
        n = len(valid_items)
        if n == 0:
            return AccuracyMetrics(
                period_count=0,
                mae_mw=0.0,
                rmse_mw=0.0,
                mape_percent=0.0,
                mean_bias_error_mw=0.0,
                bias_direction="BALANCED",
                max_overforecast_mw=0.0,
                max_underforecast_mw=0.0,
                total_forecast_energy_mwh=0.0,
                total_actual_energy_mwh=0.0,
                p10_error_mw=0.0,
                p50_error_mw=0.0,
                p90_error_mw=0.0
            )

        errors = np.array([p.error_mw for p in valid_items if p.error_mw is not None])
        abs_errors = np.abs(errors)
        actuals = np.array([p.actual_generation_mw for p in valid_items])
        forecasts = np.array([p.forecast_generation_mw for p in valid_items])

        mae = float(np.mean(abs_errors))
        rmse = float(math.sqrt(np.mean(errors ** 2)))
        
        # MAPE with zero-division safeguard
        pct_errors = [p.error_percentage for p in valid_items if p.error_percentage is not None]
        mape = float(np.mean(pct_errors)) if pct_errors else 0.0

        mbe = float(np.mean(errors))
        max_over = float(np.max(errors)) if len(errors) > 0 else 0.0
        max_under = float(np.min(errors)) if len(errors) > 0 else 0.0

        # Each settlement period is 30 minutes (0.5 hour)
        total_fc_mwh = float(np.sum(forecasts) * 0.5)
        total_act_mwh = float(np.sum(actuals) * 0.5)

        p10 = float(np.percentile(errors, 10))
        p50 = float(np.percentile(errors, 50))
        p90 = float(np.percentile(errors, 90))

        if mbe > 150.0:
            bias_dir = "OVERFORECAST_DEFICIT"
        elif mbe < -150.0:
            bias_dir = "UNDERFORECAST_SURPLUS"
        else:
            bias_dir = "BALANCED"

        return AccuracyMetrics(
            period_count=n,
            mae_mw=round(mae, 1),
            rmse_mw=round(rmse, 1),
            mape_percent=round(mape, 2),
            mean_bias_error_mw=round(mbe, 1),
            bias_direction=bias_dir,
            max_overforecast_mw=round(max_over, 1),
            max_underforecast_mw=round(max_under, 1),
            total_forecast_energy_mwh=round(total_fc_mwh, 1),
            total_actual_energy_mwh=round(total_act_mwh, 1),
            p10_error_mw=round(p10, 1),
            p50_error_mw=round(p50, 1),
            p90_error_mw=round(p90, 1)
        )

    def generate_procurement_advice(
        self,
        delivery_date: str,
        decision_date: str,
        gate_cutoff: str,
        periods: List[SettlementPeriodItem],
        metrics: AccuracyMetrics,
        risk_profile: str = "P90"
    ) -> ThermalProcurementAdvice:
        """
        Translates wind forecast accuracy & error quantification into actionable Day-Ahead
        thermal procurement volumes and safety margins.
        """
        # Sum half-hourly demands to total MWh (30 min = 0.5h)
        total_demand_mwh = sum(p.consumer_demand_mw * 0.5 for p in periods)
        expected_wind_mwh = sum(p.forecast_generation_mw * 0.5 for p in periods)
        base_thermal_mwh = max(0.0, total_demand_mwh - expected_wind_mwh)

        # Risk buffer calculation:
        # If wind is over-forecasted, actual wind will be lower, requiring more thermal generation.
        # P90 risk profile adds a buffer based on the 90th percentile over-forecast risk.
        if risk_profile == "P90":
            buffer_mw = max(0.0, metrics.p90_error_mw)
        elif risk_profile == "P75":
            buffer_mw = max(0.0, metrics.p50_error_mw + (metrics.p90_error_mw - metrics.p50_error_mw) * 0.5)
        else: # P50 (Expected)
            buffer_mw = max(0.0, metrics.p50_error_mw)

        # Buffer applied over 24 hours (average MW buffer converted to MWh)
        recommended_buffer_mwh = buffer_mw * 24.0
        recommended_thermal_mwh = base_thermal_mwh + recommended_buffer_mwh

        if metrics.mean_bias_error_mw > 200.0:
            summary = (
                f"Significant Over-Forecasting Bias (+{metrics.mean_bias_error_mw} MW avg). "
                f"High risk of real-time deficit. Strongly recommend procuring at least +{round(buffer_mw, 0)} MW "
                f"({round(recommended_buffer_mwh, 0)} MWh) additional thermal power in the Day-Ahead auction "
                f"to hedge against expensive Cashout System Buy Prices (SBP)."
            )
        elif metrics.mean_bias_error_mw < -200.0:
            summary = (
                f"Under-Forecasting Bias ({metrics.mean_bias_error_mw} MW avg). Wind generation expected to outperform. "
                f"Minimal deficit risk; procurement can be safely sized closer to baseline to avoid long position spill discounts."
            )
        else:
            summary = (
                f"Forecast model well-calibrated (MAE {metrics.mae_mw} MW, MBE {metrics.mean_bias_error_mw} MW). "
                f"Standard {risk_profile} safety reserve of +{round(buffer_mw, 0)} MW recommended."
            )

        return ThermalProcurementAdvice(
            delivery_date=delivery_date,
            decision_date=decision_date,
            gate_closure_cutoff=gate_cutoff,
            risk_profile=risk_profile,
            total_demand_mwh=round(total_demand_mwh, 1),
            expected_wind_generation_mwh=round(expected_wind_mwh, 1),
            base_thermal_procurement_mwh=round(base_thermal_mwh, 1),
            recommended_procurement_buffer_mw=round(buffer_mw, 1),
            recommended_thermal_procurement_mwh=round(recommended_thermal_mwh, 1),
            financial_risk_summary=summary
        )

    def compute_month_summary(self, month: str = "2026-01", gate_closure_hour: int = 11) -> MonthSummaryResponse:
        """
        Computes monthly statistics for all days in January 2026,
        including diurnal settlement period error profile (periods 1-48).
        """
        all_dates = [d for d in elexon_client.get_all_available_dates() if d.startswith(month)]
        
        all_periods: List[SettlementPeriodItem] = []
        daily_summaries: List[DailySummaryItem] = []
        sp_buckets: Dict[int, List[Dict[str, float]]] = {sp: [] for sp in range(1, 49)}

        for date_str in all_dates:
            periods, dec_date, _, _ = data_processor.process_day_ahead(date_str, gate_closure_hour)
            all_periods.extend(periods)
            
            day_metrics = self.compute_accuracy_metrics(periods)
            act_avg = float(np.mean([p.actual_generation_mw for p in periods if p.actual_generation_mw is not None]))
            fc_avg = float(np.mean([p.forecast_generation_mw for p in periods]))
            
            daily_summaries.append(DailySummaryItem(
                delivery_date=date_str,
                decision_date=dec_date,
                mae_mw=day_metrics.mae_mw,
                rmse_mw=day_metrics.rmse_mw,
                bias_mw=day_metrics.mean_bias_error_mw,
                avg_actual_mw=round(act_avg, 1),
                avg_forecast_mw=round(fc_avg, 1)
            ))
            
            for p in periods:
                if p.actual_generation_mw is not None and p.error_mw is not None:
                    sp_buckets[p.settlement_period].append({
                        "actual": p.actual_generation_mw,
                        "forecast": p.forecast_generation_mw,
                        "abs_err": p.abs_error_mw or 0.0,
                        "err": p.error_mw
                    })

        # Overall monthly accuracy metrics
        monthly_metrics = self.compute_accuracy_metrics(all_periods)

        # Diurnal period profiles (HH 1 to 48)
        period_profiles: List[PeriodProfileItem] = []
        for sp in range(1, 49):
            records = sp_buckets[sp]
            if records:
                avg_act = float(np.mean([r["actual"] for r in records]))
                avg_fc = float(np.mean([r["forecast"] for r in records]))
                avg_mae = float(np.mean([r["abs_err"] for r in records]))
                avg_bias = float(np.mean([r["err"] for r in records]))
            else:
                avg_act, avg_fc, avg_mae, avg_bias = 0.0, 0.0, 0.0, 0.0
                
            period_profiles.append(PeriodProfileItem(
                settlement_period=sp,
                time_label=format_sp_time(sp),
                avg_actual_mw=round(avg_act, 1),
                avg_forecast_mw=round(avg_fc, 1),
                mae_mw=round(avg_mae, 1),
                bias_mw=round(avg_bias, 1)
            ))

        return MonthSummaryResponse(
            month=month,
            total_days=len(all_dates),
            data_source="Elexon BMRS Live & Stream Seed",
            monthly_metrics=monthly_metrics,
            period_profiles=period_profiles,
            daily_summaries=daily_summaries
        )

metrics_engine = MetricsEngine()
