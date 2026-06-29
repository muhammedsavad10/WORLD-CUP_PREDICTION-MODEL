from fastapi import APIRouter, Depends, Request, BackgroundTasks
from app.schemas.response import APIResponse
from app.services.reasoning_service import ReasoningService
from app.repositories.results import JSONResultsRepository
from app.repositories.probabilities import JSONProbabilityRepository
from app.repositories.cache import SQLiteXAICacheRepository
from app.core.config import settings

router = APIRouter(tags=["Reasoning"])

def get_reasoning_service(request: Request) -> ReasoningService:
    results_repo = JSONResultsRepository(settings.RESULTS_JSON_PATH)
    prob_repo = JSONProbabilityRepository(settings.PROBABILITIES_JSON_PATH, settings.SNAPSHOTS_DIR)
    cache_repo = SQLiteXAICacheRepository(settings.SQLITE_DB_PATH)
    return ReasoningService(
        results_repo=results_repo,
        prob_repo=prob_repo,
        cache_repo=cache_repo,
        event_bus=request.app.state.event_bus,
        rankings_df=request.app.state.rankings_df,
        model=request.app.state.model
    )

from pydantic import BaseModel

class H2HAnalyzeRequest(BaseModel):
    match_number: int
    home_team: str
    away_team: str

@router.post("/analyze", response_model=APIResponse)
async def analyze_match(
    request: H2HAnalyzeRequest,
    background_tasks: BackgroundTasks,
    service: ReasoningService = Depends(get_reasoning_service)
):
    result = service.get_h2h_explanation(request.home_team, request.away_team, background_tasks)
    return APIResponse(data=result)

@router.get("/status", response_model=APIResponse)
async def get_analysis_status(
    home_team: str,
    away_team: str,
    service: ReasoningService = Depends(get_reasoning_service)
):
    result = service.get_h2h_status(home_team, away_team)
    return APIResponse(data=result)

@router.get("/{match_number}", response_model=APIResponse)
async def get_match_reasoning(
    match_number: int,
    background_tasks: BackgroundTasks,
    service: ReasoningService = Depends(get_reasoning_service)
):
    result = service.get_match_explanation(match_number, background_tasks)
    return APIResponse(data=result)
