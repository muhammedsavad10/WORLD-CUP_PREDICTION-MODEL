import os
from pathlib import Path
from pydantic_settings import BaseSettings

# Dynamically resolve workspace root (4 levels up from this file)
WORKSPACE_ROOT = Path(__file__).resolve().parents[4]

class Settings(BaseSettings):
    API_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "FIFA World Cup 2026 Prediction Engine"
    
    # Default Paths
    DATA_DIR: str = str(WORKSPACE_ROOT / "data")
    RESULTS_JSON_PATH: str = str(WORKSPACE_ROOT / "data" / "world_cup_2026_live_results.json")
    PROBABILITIES_JSON_PATH: str = str(WORKSPACE_ROOT / "data" / "world_cup_2026_live_probabilities.json")
    BASELINE_PROBABILITIES_JSON_PATH: str = str(WORKSPACE_ROOT / "data" / "world_cup_2026_baseline_probabilities.json")
    SNAPSHOTS_DIR: str = str(WORKSPACE_ROOT / "data" / "snapshots")
    MODEL_JSON_PATH: str = str(WORKSPACE_ROOT / "data" / "logistic_regression_model.json")
    SQLITE_DB_PATH: str = str(WORKSPACE_ROOT / "data" / "xai_cache.db")
    
    # Environment API Keys
    GROQ_API_KEY: str = "MOCK"
    API_FOOTBALL_KEY: str = "MOCK"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
