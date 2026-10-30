"""
Elexon BMRS API Client with resilient fallback to embedded benchmark data.
Handles FUELHH (Actuals) and WINDFOR (Forecasts) streams.
"""

import requests
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.config import settings
from app.data.jan_2026_seed import get_seed_data

logger = logging.getLogger(__name__)

class ElexonClient:
    def __init__(self, base_url: str = settings.ELEXON_BASE_URL, timeout: float = 2.0):
        self.base_url = base_url
        self.timeout = timeout
        self.enable_live = settings.ENABLE_LIVE_ELEXON_API
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "GridWholesale-Wind-Analytics/1.0 (Day-Ahead-Desk)",
            "Accept": "application/json"
        })

    def get_actuals_for_date(self, settlement_date: str) -> List[Dict[str, Any]]:
        """
        Fetches actual wind generation from FUELHH dataset for a specific date (YYYY-MM-DD).
        Filter: fuelType == 'WIND'
        """
        if self.enable_live:
            live_data = self._fetch_live_fuelhh(settlement_date)
            if live_data:
                return live_data
        
        # Fallback to embedded January 2026 dataset
        seed = get_seed_data()
        return [
            rec for rec in seed["fuelhh"]
            if rec.get("settlementDate") == settlement_date and rec.get("fuelType") == "WIND"
        ]

    def get_forecasts_for_date(self, target_date: str) -> List[Dict[str, Any]]:
        """
        Fetches wind forecasts from WINDFOR dataset for target delivery date (YYYY-MM-DD).
        """
        if self.enable_live:
            live_data = self._fetch_live_windfor(target_date)
            if live_data:
                return live_data
        
        # Fallback to embedded January 2026 dataset
        seed = get_seed_data()
        return [
            rec for rec in seed["windfor"]
            if rec.get("startTime", "").startswith(target_date)
        ]

    def _fetch_live_fuelhh(self, date_str: str) -> Optional[List[Dict[str, Any]]]:
        try:
            url = f"{self.base_url}/datasets/FUELHH/stream"
            params = {
                "settlementDate": date_str,
                "fuelType": "WIND"
            }
            resp = self.session.get(url, params=params, timeout=self.timeout)
            if resp.status_code == 200:
                data = resp.json()
                if isinstance(data, list) and len(data) > 0:
                    return data
        except Exception as e:
            logger.debug(f"Live FUELHH fetch failed: {e}")
        return None

    def _fetch_live_windfor(self, date_str: str) -> Optional[List[Dict[str, Any]]]:
        try:
            url = f"{self.base_url}/datasets/WINDFOR/stream"
            params = {"settlementDate": date_str}
            resp = self.session.get(url, params=params, timeout=self.timeout)
            if resp.status_code == 200:
                data = resp.json()
                if isinstance(data, list) and len(data) > 0:
                    return data
        except Exception as e:
            logger.debug(f"Live WINDFOR fetch failed: {e}")
        return None

    def get_all_available_dates(self) -> List[str]:
        seed = get_seed_data()
        dates = sorted(list({rec["settlementDate"] for rec in seed["fuelhh"]}))
        return dates

elexon_client = ElexonClient()
