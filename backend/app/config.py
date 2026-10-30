"""
Configuration and constants for the UK Day-Ahead Electricity Market & Elexon Wind Analytics.
"""

from pydantic import BaseModel
import os

class Settings(BaseModel):
    PROJECT_NAME: str = "GridWholesale Wind Analytics - UK Day-Ahead Desk"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Market Constants
    # UK Day-Ahead auction order books (EPEX SPOT / Nord Pool) typically close around 11:00 or 12:00 UTC on D-1.
    DEFAULT_GATE_CLOSURE_HOUR: int = 11  # 11:00 UTC on D-1
    SETTLEMENT_PERIODS_PER_DAY: int = 48
    MINUTES_PER_PERIOD: int = 30
    
    # Average UK Winter electricity demand baseline (MW) for January 2026
    DEFAULT_WINTER_PEAK_DEMAND_MW: float = 42000.0
    DEFAULT_WINTER_BASE_DEMAND_MW: float = 28000.0
    
    # Elexon API Endpoints
    ELEXON_BASE_URL: str = os.getenv("ELEXON_BASE_URL", "https://data.elexon.co.uk/bmrs/api/v1")
    ENABLE_LIVE_ELEXON_API: bool = os.getenv("ENABLE_LIVE_ELEXON_API", "false").lower() == "true"
    FUELHH_ENDPOINT: str = "/datasets/FUELHH/stream"
    WINDFOR_ENDPOINT: str = "/datasets/WINDFOR/stream"
    
    # Target Scope: January 2026 purchase decisions
    TARGET_MONTH: str = "2026-01"

settings = Settings()
