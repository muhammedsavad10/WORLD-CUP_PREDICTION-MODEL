from fastapi import APIRouter, Depends, Request
from app.schemas.response import APIResponse
from app.services.dashboard_service import DashboardService
from app.repositories.results import JSONResultsRepository
from app.repositories.probabilities import JSONProbabilityRepository
from app.core.config import settings

router = APIRouter(tags=["Dashboard"])

def get_dashboard_service(request: Request) -> DashboardService:
    results_repo = JSONResultsRepository(settings.RESULTS_JSON_PATH)
    prob_repo = JSONProbabilityRepository(settings.PROBABILITIES_JSON_PATH, settings.SNAPSHOTS_DIR)
    return DashboardService(
        results_repo=results_repo,
        prob_repo=prob_repo,
        model=request.app.state.model,
        rankings_df=request.app.state.rankings_df
    )

@router.get("", response_model=APIResponse)
async def get_dashboard(service: DashboardService = Depends(get_dashboard_service)):
    data = service.get_dashboard_summary()
    return APIResponse(data=data)
