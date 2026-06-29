from fastapi import APIRouter, Depends, Request
from app.schemas.response import APIResponse
from app.services.simulation_service import SimulationService
from app.repositories.results import JSONResultsRepository
from app.core.config import settings

router = APIRouter(tags=["Simulation"])

def get_simulation_service(request: Request) -> SimulationService:
    results_repo = JSONResultsRepository(settings.RESULTS_JSON_PATH)
    return SimulationService(
        results_repo=results_repo,
        model=request.app.state.model,
        rankings_df=request.app.state.rankings_df
    )

@router.post("/run", response_model=APIResponse)
async def run_simulation(service: SimulationService = Depends(get_simulation_service)):
    result = service.run_single_simulation()
    return APIResponse(data=result)

@router.get("/tree", response_model=APIResponse)
async def get_simulation_tree(service: SimulationService = Depends(get_simulation_service)):
    result = service.run_single_simulation()
    return APIResponse(data=result)

@router.get("/timeline", response_model=APIResponse)
async def get_probability_timeline():
    from app.repositories.probabilities import JSONProbabilityRepository
    prob_repo = JSONProbabilityRepository(settings.PROBABILITIES_JSON_PATH, settings.SNAPSHOTS_DIR)
    snapshots = prob_repo.get_timeline_history()
    data = [s.model_dump() for s in snapshots]
    return APIResponse(data=data)
