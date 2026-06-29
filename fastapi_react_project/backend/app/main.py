import os
import json
import datetime
import asyncio
import pandas as pd
from typing import Any
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.logging import LoggingMiddleware, logger
from app.core.events import EventBus
from app.schemas.response import ErrorResponse, ErrorDetail

# Import data science modules from worldcup_engine package
from worldcup_engine.const import WCGroups
from worldcup_engine.preprocess import load_data
import worldcup_engine.preprocess as preprocess
from worldcup_engine.update_results import JSONLogisticRegressionModel

# EventBus file modification checking loop
async def file_watcher_loop(app: FastAPI):
    results_path = settings.RESULTS_JSON_PATH
    probs_path = settings.PROBABILITIES_JSON_PATH
    
    last_results_mtime = os.path.getmtime(results_path) if os.path.exists(results_path) else 0.0
    last_probs_mtime = os.path.getmtime(probs_path) if os.path.exists(probs_path) else 0.0
    
    logger.info("WebSocket file watcher loop started.")
    while True:
        await asyncio.sleep(2.0)
        
        # Check results file
        if os.path.exists(results_path):
            try:
                current_results_mtime = os.path.getmtime(results_path)
                if current_results_mtime != last_results_mtime:
                    last_results_mtime = current_results_mtime
                    logger.info("Detection: world_cup_2026_live_results.json updated on disk. Broadcasting MATCH_UPDATED.")
                    await app.state.event_bus.publish("MATCH_UPDATED")
            except Exception:
                pass
                
        # Check probabilities file
        if os.path.exists(probs_path):
            try:
                current_probs_mtime = os.path.getmtime(probs_path)
                if current_probs_mtime != last_probs_mtime:
                    last_probs_mtime = current_probs_mtime
                    logger.info("Detection: world_cup_2026_live_probabilities.json updated on disk. Broadcasting PROBABILITIES_UPDATED.")
                    await app.state.event_bus.publish("PROBABILITIES_UPDATED")
            except Exception:
                pass

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Set environment settings
    os.environ["GROQ_API_KEY"] = settings.GROQ_API_KEY

    # Load JSON model coefficients
    model_json_path = settings.MODEL_JSON_PATH
    if not os.path.exists(model_json_path):
        raise FileNotFoundError(f"Model coefficients JSON not found at {model_json_path}")
        
    with open(model_json_path, "r", encoding="utf-8") as f:
        model_data = json.load(f)
    pipeline = JSONLogisticRegressionModel(model_data)
    app.state.model = pipeline

    # Load rankings data
    X, y, rankings_df = load_data()

    # Strictly filter out all legacy teams from stats and rankings
    qualified_teams = set()
    for grp in WCGroups:
        for team in grp:
            qualified_teams.add(team)

    preprocess.final_team_stats = {
        team: stats for team, stats in preprocess.final_team_stats.items() if team in qualified_teams
    }
    app.state.rankings_df = rankings_df[rankings_df['country_full'].isin(qualified_teams)].copy()

    # Initialize EventBus
    app.state.event_bus = EventBus()

    # Launch file modification checking task
    watcher_task = asyncio.create_task(file_watcher_loop(app))
    
    yield
    
    watcher_task.cancel()
    try:
        await watcher_task
    except asyncio.CancelledError:
        pass

app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan,
    version="1.0.0",
    docs_url=f"{settings.API_PREFIX}/docs",
    openapi_url=f"{settings.API_PREFIX}/openapi.json"
)

# Apply CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Apply logging timing middleware
app.add_middleware(LoggingMiddleware)

# Exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    message = errors[0].get("msg", "Validation error") if errors else "Invalid request parameters."
    error_detail = ErrorDetail(code="VALIDATION_ERROR", message=message)
    response_content = ErrorResponse(error=error_detail)
    return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content=response_content.model_dump())

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    code = "HTTP_ERROR"
    if exc.status_code == status.HTTP_404_NOT_FOUND:
        code = "NOT_FOUND"
    elif exc.status_code == status.HTTP_401_UNAUTHORIZED:
        code = "UNAUTHORIZED"
        
    error_detail = ErrorDetail(code=code, message=exc.detail)
    response_content = ErrorResponse(error=error_detail)
    return JSONResponse(status_code=exc.status_code, content=response_content.model_dump())

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    error_detail = ErrorDetail(code="INTERNAL_SERVER_ERROR", message="An unexpected error occurred on the server.")
    response_content = ErrorResponse(error=error_detail)
    return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content=response_content.model_dump())

# WebSocket connection route
@app.websocket(f"{settings.API_PREFIX}/public/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    event_bus = websocket.app.state.event_bus
    await event_bus.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        event_bus.disconnect(websocket)
    except Exception:
        event_bus.disconnect(websocket)

# Import routes
from app.api.v1.public.dashboard import router as public_dashboard_router
from app.api.v1.public.matches import router as public_matches_router
from app.api.v1.public.simulation import router as public_simulation_router
from app.api.v1.public.reasoning import router as public_reasoning_router
from app.api.v1.public.system import router as public_system_router
from app.api.v1.admin.cache import router as admin_cache_router
from app.api.v1.admin.simulation import router as admin_simulation_router

# Include routes
app.include_router(public_dashboard_router, prefix=f"{settings.API_PREFIX}/public/dashboard")
app.include_router(public_matches_router, prefix=f"{settings.API_PREFIX}/public/matches")
app.include_router(public_simulation_router, prefix=f"{settings.API_PREFIX}/public/simulation")
app.include_router(public_reasoning_router, prefix=f"{settings.API_PREFIX}/public/reasoning")
app.include_router(public_system_router, prefix=f"{settings.API_PREFIX}/public/system")
app.include_router(admin_cache_router, prefix=f"{settings.API_PREFIX}/admin/cache")
app.include_router(admin_simulation_router, prefix=f"{settings.API_PREFIX}/admin/simulation")
