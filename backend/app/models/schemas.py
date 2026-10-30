"""
Pydantic schemas for Day-Ahead electricity trading and wind forecast accuracy.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class SettlementPeriodItem(BaseModel):
    settlement_period: int = Field(..., description="Half-hour period index from 1 to 48")
    time_label: str = Field(..., description="Human readable time e.g. '12:00'")
    start_time: str = Field(..., description="Target settlement start time (UTC ISO)")
    end_time: str = Field(..., description="Target settlement end time (UTC ISO)")
    forecast_generation_mw: float = Field(..., description="Wind forecast available at D-1 gate closure (MW)")
    forecast_publish_time: str = Field(..., description="Exact publish time of the forecast used (UTC ISO)")
    actual_generation_mw: Optional[float] = Field(None, description="Actual metered wind generation (MW)")
    error_mw: Optional[float] = Field(None, description="Forecast - Actual in MW (Positive = Over-forecast)")
    abs_error_mw: Optional[float] = Field(None, description="Absolute error |Forecast - Actual| in MW")
    error_percentage: Optional[float] = Field(None, description="Absolute percentage error relative to actual")
    consumer_demand_mw: float = Field(..., description="Estimated consumer demand for this half-hour (MW)")
    net_residual_thermal_required_mw: float = Field(..., description="Demand minus Wind Forecast to procure from Day-Ahead market (MW)")
    imbalance_risk: Optional[str] = Field(None, description="'OVERFORECAST_DEFICIT' | 'UNDERFORECAST_SURPLUS' | 'BALANCED'")

class AccuracyMetrics(BaseModel):
    period_count: int
    mae_mw: float = Field(..., description="Mean Absolute Error in MW")
    rmse_mw: float = Field(..., description="Root Mean Squared Error in MW")
    mape_percent: float = Field(..., description="Mean Absolute Percentage Error (%)")
    mean_bias_error_mw: float = Field(..., description="Mean Bias Error (Positive = Over-forecast, Negative = Under-forecast)")
    bias_direction: str = Field(..., description="'OVERFORECAST_DEFICIT' | 'UNDERFORECAST_SURPLUS' | 'BALANCED'")
    max_overforecast_mw: float
    max_underforecast_mw: float
    total_forecast_energy_mwh: float
    total_actual_energy_mwh: float
    p10_error_mw: float = Field(..., description="10th percentile error (MW)")
    p50_error_mw: float = Field(..., description="Median error (MW)")
    p90_error_mw: float = Field(..., description="90th percentile error (MW)")

class ThermalProcurementAdvice(BaseModel):
    delivery_date: str
    decision_date: str
    gate_closure_cutoff: str
    risk_profile: str
    total_demand_mwh: float
    expected_wind_generation_mwh: float
    base_thermal_procurement_mwh: float
    recommended_procurement_buffer_mw: float
    recommended_thermal_procurement_mwh: float
    financial_risk_summary: str

class DayAheadResponse(BaseModel):
    delivery_date: str
    decision_date: str
    gate_closure_cutoff: str
    data_source: str
    metrics: AccuracyMetrics
    procurement_advice: ThermalProcurementAdvice
    periods: List[SettlementPeriodItem]

class PeriodProfileItem(BaseModel):
    settlement_period: int
    time_label: str
    avg_actual_mw: float
    avg_forecast_mw: float
    mae_mw: float
    bias_mw: float

class DailySummaryItem(BaseModel):
    delivery_date: str
    decision_date: str
    mae_mw: float
    rmse_mw: float
    bias_mw: float
    avg_actual_mw: float
    avg_forecast_mw: float

class MonthSummaryResponse(BaseModel):
    month: str
    total_days: int
    data_source: str
    monthly_metrics: AccuracyMetrics
    period_profiles: List[PeriodProfileItem]
    daily_summaries: List[DailySummaryItem]

class ForecastEvolutionPoint(BaseModel):
    publish_time: str
    forecast_mw: float
    lead_time_hours: float
    is_at_or_before_gate: bool

class ForecastEvolutionResponse(BaseModel):
    delivery_date: str
    settlement_period: int
    target_start_time: str
    actual_generation_mw: Optional[float]
    gate_closure_time: str
    latest_gate_forecast_mw: float
    evolution: List[ForecastEvolutionPoint]
