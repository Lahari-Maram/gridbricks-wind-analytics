"""
High-fidelity Elexon data generator and seed cache for January 2026.
Synthesizes realistic UK national wind generation actuals (FUELHH, fuelType=WIND)
and multi-horizon forecasts (WINDFOR) matching historical UK winter meteorological patterns.
"""

import math
import random
from datetime import datetime, timedelta
from typing import Dict, List, Any

RANDOM_SEED = 202601

def generate_january_2026_data() -> Dict[str, Any]:
    rng = random.Random(RANDOM_SEED)
    
    fuelhh_records = []
    windfor_records = []
    
    start_date = datetime(2026, 1, 1)
    end_date = datetime(2026, 1, 31)
    total_capacity_mw = 30000.0
    
    daily_regimes = []
    curr_weather = 0.55
    for day_idx in range(35):
        curr_weather = 0.7 * curr_weather + 0.3 * (0.2 + 0.65 * rng.random())
        if day_idx in [9, 10, 20, 21, 22]:
            curr_weather = min(0.92, curr_weather + 0.35)
        elif day_idx in [4, 5, 14, 15]:
            curr_weather = max(0.12, curr_weather - 0.28)
        daily_regimes.append(curr_weather)
        
    current_day = start_date
    day_counter = 0
    
    while current_day <= end_date:
        date_str = current_day.strftime("%Y-%m-%d")
        regime = daily_regimes[day_counter]
        next_regime = daily_regimes[day_counter + 1]
        
        d_minus_1 = current_day - timedelta(days=1)
        d_minus_2 = current_day - timedelta(days=2)
        
        publish_schedule = [
            (d_minus_2 + timedelta(hours=18)).strftime("%Y-%m-%dT18:00:00Z"),
            (d_minus_1 + timedelta(hours=6)).strftime("%Y-%m-%dT06:00:00Z"),
            (d_minus_1 + timedelta(hours=9)).strftime("%Y-%m-%dT09:00:00Z"),
            (d_minus_1 + timedelta(hours=11)).strftime("%Y-%m-%dT11:00:00Z"),
            (d_minus_1 + timedelta(hours=14)).strftime("%Y-%m-%dT14:00:00Z"),
            (d_minus_1 + timedelta(hours=17)).strftime("%Y-%m-%dT17:00:00Z"),
            (current_day + timedelta(hours=4)).strftime("%Y-%m-%dT04:00:00Z"),
        ]
        
        phase_shift_bias = rng.gauss(0, 0.03)

        for sp in range(1, 49):
            sp_minutes = (sp - 1) * 30
            sp_start = current_day + timedelta(minutes=sp_minutes)
            sp_start_iso = sp_start.strftime("%Y-%m-%dT%H:%M:%SZ")
            
            progress = (sp - 1) / 48.0
            day_cf = (1.0 - progress) * regime + progress * next_regime
            diurnal = 0.08 * math.sin((sp - 16) * math.pi / 24.0)
            noise = rng.gauss(0, 0.025)
            
            cf = max(0.08, min(0.95, day_cf + diurnal + noise))
            actual_gen_mw = round(cf * total_capacity_mw, 1)
            
            fuelhh_records.append({
                "dataset": "FUELHH",
                "fuelType": "WIND",
                "settlementDate": date_str,
                "settlementPeriod": sp,
                "startTime": sp_start_iso,
                "generation": actual_gen_mw
            })
            
            for pub_time_iso in publish_schedule:
                # Fast string compare: forecast must be published before target delivery
                if pub_time_iso >= sp_start_iso:
                    continue
                
                # Approximate lead time in hours
                std_dev = 0.04
                forecast_error = rng.gauss(phase_shift_bias, std_dev)
                forecast_cf = max(0.05, min(0.96, cf + forecast_error))
                forecast_gen_mw = round(forecast_cf * total_capacity_mw, 1)
                
                windfor_records.append({
                    "dataset": "WINDFOR",
                    "settlementDate": date_str,
                    "settlementPeriod": sp,
                    "startTime": sp_start_iso,
                    "publishTime": pub_time_iso,
                    "generation": forecast_gen_mw
                })
                
        current_day += timedelta(days=1)
        day_counter += 1
        
    return {
        "fuelhh": fuelhh_records,
        "windfor": windfor_records
    }

_CACHE: Dict[str, Any] = {}

def get_seed_data() -> Dict[str, Any]:
    global _CACHE
    if not _CACHE:
        _CACHE = generate_january_2026_data()
    return _CACHE
