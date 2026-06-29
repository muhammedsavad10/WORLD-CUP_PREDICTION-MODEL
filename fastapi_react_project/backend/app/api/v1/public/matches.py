from fastapi import APIRouter, Depends, Request, Query, HTTPException
from typing import Optional
from app.schemas.response import APIResponse
from app.services.match_service import MatchService
from app.repositories.results import JSONResultsRepository
from app.core.config import settings

router = APIRouter(tags=["Matches"])

def get_match_service(request: Request) -> MatchService:
    results_repo = JSONResultsRepository(settings.RESULTS_JSON_PATH)
    return MatchService(
        results_repo=results_repo,
        model=request.app.state.model,
        rankings_df=request.app.state.rankings_df
    )

@router.get("", response_model=APIResponse)
async def get_matches(
    stage: Optional[str] = Query(None, description="Filter matches by stage (e.g. group_stage, round_of_32)"),
    service: MatchService = Depends(get_match_service)
):
    matches = service.get_all_matches()
    if stage:
        matches = [m for m in matches if m.stage == stage]
    return APIResponse(data=[m.model_dump() for m in matches])

@router.get("/h2h/predict", response_model=APIResponse)
async def get_h2h_prediction(
    home_team: str = Query(..., description="Home team name"),
    away_team: str = Query(..., description="Away team name"),
    service: MatchService = Depends(get_match_service)
):
    try:
        prediction = service.get_h2h_prediction(home_team, away_team)
        return APIResponse(data=prediction)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/h2h/fixtures", response_model=APIResponse)
async def get_h2h_fixtures(service: MatchService = Depends(get_match_service)):
    fixtures = service.get_valid_h2h_fixtures()
    return APIResponse(data=fixtures)

@router.get("/standings", response_model=APIResponse)
async def get_standings(service: MatchService = Depends(get_match_service)):
    standings = service.get_group_standings()
    return APIResponse(data=standings)

@router.get("/{match_number}", response_model=APIResponse)
async def get_match(
    match_number: int,
    service: MatchService = Depends(get_match_service)
):
    match_obj = service.get_match_by_number(match_number)
    if not match_obj:
        raise HTTPException(status_code=404, detail=f"Match number {match_number} not found.")
    return APIResponse(data=match_obj.model_dump())
