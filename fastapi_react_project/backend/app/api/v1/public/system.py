import os
import sqlite3
from fastapi import APIRouter, Depends, Request
from app.schemas.response import APIResponse
from app.services.analytics_service import AnalyticsService
from app.repositories.results import JSONResultsRepository
from app.repositories.probabilities import JSONProbabilityRepository
from app.core.config import settings

router = APIRouter(tags=["System"])

def get_analytics_service(request: Request) -> AnalyticsService:
    results_repo = JSONResultsRepository(settings.RESULTS_JSON_PATH)
    return AnalyticsService(
        results_repo=results_repo,
        model=request.app.state.model,
        rankings_df=request.app.state.rankings_df
    )

@router.get("/status", response_model=APIResponse)
async def get_system_status(request: Request):
    sqlite_healthy = False
    sqlite_size_kb = 0.0
    if os.path.exists(settings.SQLITE_DB_PATH):
        try:
            sqlite_size_kb = round(os.path.getsize(settings.SQLITE_DB_PATH) / 1024, 2)
            conn = sqlite3.connect(settings.SQLITE_DB_PATH)
            conn.execute("SELECT 1;")
            conn.close()
            sqlite_healthy = True
        except Exception:
            pass

    snapshots_count = 0
    if os.path.exists(settings.SNAPSHOTS_DIR):
        try:
            snapshots_count = len([f for f in os.listdir(settings.SNAPSHOTS_DIR) if f.endswith(".json")])
        except Exception:
            pass

    event_bus = request.app.state.event_bus
    ws_clients_count = len(event_bus.active_connections)

    from worldcup_engine.config import MODEL_VERSION, FORECAST_VERSION
    
    return APIResponse(data={
        "status": "healthy",
        "engine_version": "1.0.0",
        "model_version": MODEL_VERSION,
        "forecast_version": FORECAST_VERSION,
        "websocket_active_clients": ws_clients_count,
        "cache_database": {
            "healthy": sqlite_healthy,
            "size_kb": sqlite_size_kb
        },
        "timeline_snapshots": snapshots_count
    })

@router.get("/analytics", response_model=APIResponse)
async def get_model_analytics(service: AnalyticsService = Depends(get_analytics_service)):
    data = service.get_analytics_metrics()
    return APIResponse(data=data)


