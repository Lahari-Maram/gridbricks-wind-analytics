"""
Data Processor: Matches FUELHH actuals with WINDFOR forecasts at D-1 Day-Ahead Gate Closure.
Calculates net residual demand for thermal procurement.
Uses ultra-fast ISO-string chronology comparison.
"""

from datetime import datetime, timedelta
import math
from typing import List, Dict, Any, Tuple
from app.config import settings
from app.services.elexon_client import elexon_client
from app.models.schemas import SettlementPeriodItem, ForecastEvolutionPoint

def get_uk_winter_demand_curve(settlement_period: int) -> float:
    base = 26000.0
    morning_peak = 11000.0 * math.exp(-0.5 * ((settlement_period - 17) / 2.5) ** 2)
    evening_peak = 16000.0 * math.exp(-0.5 * ((settlement_period - 36) / 2.8) ** 2)
    day_plateau = 7000.0 * (1.0 / (1.0 + math.exp(-(settlement_period - 18) / 1.5))) * (1.0 / (1.0 + math.exp((settlement_period - 42) / 1.5)))
    demand = base + morning_peak + evening_peak + day_plateau
    return round(demand, 1)

def format_sp_time(settlement_period: int) -> str:
    minutes_from_midnight = (settlement_period - 1) * 30
    hh = minutes_from_midnight // 60
    mm = minutes_from_midnight % 60
    return f"{hh:02d}:{mm:02d}"

class DataProcessor:
    def process_day_ahead(
        self,
        delivery_date_str: str,
        gate_closure_hour: int = settings.DEFAULT_GATE_CLOSURE_HOUR
    ) -> Tuple[List[SettlementPeriodItem], str, str, str]:
        delivery_dt = datetime.strptime(delivery_date_str, "%Y-%m-%d")
        decision_dt = delivery_dt - timedelta(days=1)
        decision_date_str = decision_dt.strftime("%Y-%m-%d")
        gate_cutoff_str = f"{decision_date_str}T{gate_closure_hour:02d}:00:00Z"

        actuals_raw = elexon_client.get_actuals_for_date(delivery_date_str)
        forecasts_raw = elexon_client.get_forecasts_for_date(delivery_date_str)

        actuals_by_sp: Dict[int, float] = {}
        for item in actuals_raw:
            sp = item.get("settlementPeriod")
            if sp is not None:
                actuals_by_sp[int(sp)] = float(item.get("generation", 0.0))

        # Fast ISO string comparison for gate closure cutoff
        forecasts_by_sp: Dict[int, Dict[str, Any]] = {}
        for item in forecasts_raw:
            pub_str = item.get("publishTime", "")
            if pub_str <= gate_cutoff_str:
                sp = item.get("settlementPeriod")
                if sp is None:
                    # Calculate sp from startTime if missing
                    st_str = item.get("startTime", "")
                    if len(st_str) >= 16:
                        hour = int(st_str[11:13])
                        minute = int(st_str[14:16])
                        sp = (hour * 60 + minute) // 30 + 1
                if sp is not None:
                    sp = int(sp)
                    gen = float(item.get("generation", 0.0))
                    if sp not in forecasts_by_sp or pub_str > forecasts_by_sp[sp]["publishTime"]:
                        forecasts_by_sp[sp] = {
                            "generation": gen,
                            "publishTime": pub_str,
                            "startTime": item.get("startTime", "")
                        }

        periods: List[SettlementPeriodItem] = []
        for sp in range(1, 49):
            time_label = format_sp_time(sp)
            sp_start_dt = delivery_dt + timedelta(minutes=(sp - 1) * 30)
            sp_end_dt = sp_start_dt + timedelta(minutes=30)
            start_iso = sp_start_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
            end_iso = sp_end_dt.strftime("%Y-%m-%dT%H:%M:%SZ")

            actual_mw = actuals_by_sp.get(sp)
            fc_entry = forecasts_by_sp.get(sp)

            if fc_entry:
                fc_mw = fc_entry["generation"]
                fc_pub = fc_entry["publishTime"]
            else:
                fc_mw = actual_mw if actual_mw is not None else 10000.0
                fc_pub = gate_cutoff_str

            error_mw = round(fc_mw - actual_mw, 1) if actual_mw is not None else None
            abs_err = abs(error_mw) if error_mw is not None else None
            err_pct = round((abs_err / actual_mw) * 100.0, 2) if (actual_mw and actual_mw > 0) else None

            demand_mw = get_uk_winter_demand_curve(sp)
            residual_mw = round(max(0.0, demand_mw - fc_mw), 1)

            imbalance = "BALANCED"
            if error_mw is not None:
                if error_mw > 200.0:
                    imbalance = "OVERFORECAST_DEFICIT"
                elif error_mw < -200.0:
                    imbalance = "UNDERFORECAST_SURPLUS"

            periods.append(SettlementPeriodItem(
                settlement_period=sp,
                time_label=time_label,
                start_time=start_iso,
                end_time=end_iso,
                forecast_generation_mw=round(fc_mw, 1),
                forecast_publish_time=fc_pub,
                actual_generation_mw=round(actual_mw, 1) if actual_mw is not None else None,
                error_mw=error_mw,
                abs_error_mw=round(abs_err, 1) if abs_err is not None else None,
                error_percentage=err_pct,
                consumer_demand_mw=demand_mw,
                net_residual_thermal_required_mw=residual_mw,
                imbalance_risk=imbalance
            ))

        data_source = "Elexon BMRS Stream & Benchmark Data"
        return periods, decision_date_str, gate_cutoff_str, data_source

    def get_forecast_evolution(
        self,
        delivery_date_str: str,
        settlement_period: int,
        gate_closure_hour: int = settings.DEFAULT_GATE_CLOSURE_HOUR
    ) -> Dict[str, Any]:
        delivery_dt = datetime.strptime(delivery_date_str, "%Y-%m-%d")
        decision_dt = delivery_dt - timedelta(days=1)
        decision_date_str = decision_dt.strftime("%Y-%m-%d")
        gate_cutoff_str = f"{decision_date_str}T{gate_closure_hour:02d}:00:00Z"

        target_start_dt = delivery_dt + timedelta(minutes=(settlement_period - 1) * 30)
        target_start_iso = target_start_dt.strftime("%Y-%m-%dT%H:%M:%SZ")

        actuals_raw = elexon_client.get_actuals_for_date(delivery_date_str)
        actual_mw = None
        for item in actuals_raw:
            if item.get("settlementPeriod") == settlement_period:
                actual_mw = float(item.get("generation", 0.0))
                break

        forecasts_raw = elexon_client.get_forecasts_for_date(delivery_date_str)
        points: List[ForecastEvolutionPoint] = []
        latest_gate_fc = 0.0
        latest_gate_time = None

        for item in forecasts_raw:
            if item.get("settlementPeriod") == settlement_period or item.get("startTime") == target_start_iso:
                pub_str = item.get("publishTime", "")
                gen = float(item.get("generation", 0.0))
                is_before_gate = pub_str <= gate_cutoff_str

                # Estimate lead time from hour string difference
                try:
                    pub_dt = datetime.strptime(pub_str.replace("Z", ""), "%Y-%m-%dT%H:%M:%S")
                    lead_hrs = round((target_start_dt - pub_dt).total_seconds() / 3600.0, 1)
                except Exception:
                    lead_hrs = 24.0

                points.append(ForecastEvolutionPoint(
                    publish_time=pub_str,
                    forecast_mw=gen,
                    lead_time_hours=lead_hrs,
                    is_at_or_before_gate=is_before_gate
                ))

                if is_before_gate:
                    if latest_gate_time is None or pub_str > latest_gate_time:
                        latest_gate_time = pub_str
                        latest_gate_fc = gen

        points.sort(key=lambda x: x.publish_time)
        return {
            "delivery_date": delivery_date_str,
            "settlement_period": settlement_period,
            "target_start_time": target_start_iso,
            "actual_generation_mw": round(actual_mw, 1) if actual_mw is not None else None,
            "gate_closure_time": gate_cutoff_str,
            "latest_gate_forecast_mw": latest_gate_fc,
            "evolution": points
        }

data_processor = DataProcessor()
