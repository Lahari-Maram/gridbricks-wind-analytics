"""
FastAPI Application Entry Point for UK Day-Ahead Wind Analytics.
"""

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import logging

from app.config import settings
from app.services.elexon_client import elexon_client
from app.services.data_processor import data_processor
from app.services.metrics_engine import metrics_engine
from app.models.schemas import (
    DayAheadResponse, MonthSummaryResponse, ForecastEvolutionResponse
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="UK Wholesale Electricity Market Day-Ahead Renewable Wind Analytics and Procurement Engine (Elexon BMRS FUELHH & WINDFOR datasets)."
)

# Enable CORS for React Frontend (local Vite and deployed Vercel domains)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "description": "API for UK Day-Ahead electricity wholesale procurement and Elexon wind forecast accuracy evaluation."
    }

@app.get("/api/health")
def health_check():
    dates = elexon_client.get_all_available_dates()
    return {
        "status": "healthy",
        "target_month": settings.TARGET_MONTH,
        "available_delivery_days_count": len(dates),
        "default_gate_closure_hour_utc": settings.DEFAULT_GATE_CLOSURE_HOUR,
        "elexon_datasets": ["FUELHH (Actuals)", "WINDFOR (Forecasts)"]
    }

@app.get("/api/dates")
def get_available_dates():
    """Returns all available delivery dates in January 2026."""
    dates = elexon_client.get_all_available_dates()
    return {
        "dates": dates,
        "default_date": "2026-01-15",
        "month": settings.TARGET_MONTH
    }

@app.get("/api/day-ahead", response_model=DayAheadResponse)
def get_day_ahead_data(
    date: str = Query("2026-01-15", description="Delivery date in January 2026 (YYYY-MM-DD)"),
    gate_closure_hour: int = Query(settings.DEFAULT_GATE_CLOSURE_HOUR, ge=0, le=23, description="D-1 decision gate cutoff hour in UTC (default 11:00)"),
    risk_profile: str = Query("P90", pattern="^(P50|P75|P90)$", description="Procurement buffer risk percentile")
):
    """
    Returns the Day-Ahead market view:
    1. Latest wind generation forecast available before D-1 gate closure
    2. Actual metered wind generation (FUELHH)
    3. Quantitative forecast error metrics (MAE, RMSE, MAPE, Bias)
    4. Residual thermal procurement recommendations to serve consumer demand
    """
    try:
        periods, dec_date, gate_cutoff, data_source = data_processor.process_day_ahead(
            delivery_date_str=date,
            gate_closure_hour=gate_closure_hour
        )
        metrics = metrics_engine.compute_accuracy_metrics(periods)
        procurement = metrics_engine.generate_procurement_advice(
            delivery_date=date,
            decision_date=dec_date,
            gate_cutoff=gate_cutoff,
            periods=periods,
            metrics=metrics,
            risk_profile=risk_profile
        )
        
        return DayAheadResponse(
            delivery_date=date,
            decision_date=dec_date,
            gate_closure_cutoff=gate_cutoff,
            data_source=data_source,
            metrics=metrics,
            procurement_advice=procurement,
            periods=periods
        )
    except Exception as e:
        logger.error(f"Error processing day ahead for date {date}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/metrics/monthly", response_model=MonthSummaryResponse)
def get_monthly_summary(
    month: str = Query("2026-01", description="Month to evaluate (YYYY-MM)"),
    gate_closure_hour: int = Query(settings.DEFAULT_GATE_CLOSURE_HOUR, ge=0, le=23)
):
    """
    Returns aggregate performance metrics across all purchase decisions made in January 2026:
    - Overall MAE, RMSE, MAPE, Mean Bias Error
    - Diurnal period-by-period (HH 1-48) error profile
    - Daily performance table
    """
    try:
        return metrics_engine.compute_month_summary(month=month, gate_closure_hour=gate_closure_hour)
    except Exception as e:
        logger.error(f"Error computing monthly summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/forecast-evolution", response_model=ForecastEvolutionResponse)
def get_forecast_evolution(
    date: str = Query("2026-01-15", description="Delivery date (YYYY-MM-DD)"),
    settlement_period: int = Query(36, ge=1, le=48, description="Settlement Period (1-48, default 36 is 17:30 evening peak)"),
    gate_closure_hour: int = Query(settings.DEFAULT_GATE_CLOSURE_HOUR, ge=0, le=23)
):
    """
    Traces how the wind forecast for a specific settlement period changed across publication times,
    highlighting which forecast was locked in at D-1 Day-Ahead gate closure.
    """
    try:
        return data_processor.get_forecast_evolution(
            delivery_date_str=date,
            settlement_period=settlement_period,
            gate_closure_hour=gate_closure_hour
        )
    except Exception as e:
        logger.error(f"Error fetching forecast evolution: {e}")
        raise HTTPException(status_code=500, detail=str(e))
