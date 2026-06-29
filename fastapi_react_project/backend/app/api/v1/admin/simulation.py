import datetime
from fastapi import APIRouter, Depends, Request, HTTPException
from app.schemas.response import APIResponse
from app.repositories.results import JSONResultsRepository
from app.repositories.probabilities import JSONProbabilityRepository
from app.domain.models import ProbabilitySnapshot
from app.core.config import settings
from worldcup_engine.tournament_simulator import TournamentSimulator
from worldcup_engine.const import WCGroups

router = APIRouter(tags=["Admin - Simulation"])

@router.post("/rebuild", response_model=APIResponse)
async def rebuild_probabilities(request: Request):
    try:
        results_repo = JSONResultsRepository(settings.RESULTS_JSON_PATH)
        prob_repo = JSONProbabilityRepository(settings.PROBABILITIES_JSON_PATH, settings.SNAPSHOTS_DIR)
        
        matches = results_repo.get_all_matches()
        matches_dict_list = [m.model_dump() for m in matches]

        from worldcup_engine.preprocess import get_match_features
        def feature_generator(t1, t2):
            return get_match_features(t1, t2, request.app.state.rankings_df)

        # Run fast Monte Carlo simulation (1000 runs)
        simulator = TournamentSimulator(
            datetime.date(2026, 6, 11),
            request.app.state.model,
            WCGroups,
            feature_generator
        )
        simulator.gamma = 0.15
        simulator.prob_cap = 0.12
        simulator.probabilistic = True

        live_probs = simulator.run_monte_carlo_simulation(matches_dict_list, num_runs=1000)

        timestamp = datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%S+05:30")
        output_data = {
            "last_updated": timestamp,
            "probabilities": live_probs
        }
        
        # Save live probabilities JSON
        prob_repo._write_json(settings.PROBABILITIES_JSON_PATH, output_data)

        # Append timeline snapshot
        champ_probs = {team: metrics.get("champion", 0.0) for team, metrics in live_probs.items()}
        qual_probs = {team: metrics.get("group_qual", 0.0) for team, metrics in live_probs.items()}
        
        snapshot = ProbabilitySnapshot(
            timestamp=timestamp,
            trigger=f"Admin manual rebuild completed ({len(matches)} matches played)",
            version="1.0.0",
            champion_probabilities=champ_probs,
            qualification_probabilities=qual_probs
        )
        prob_repo.save_snapshot(snapshot)

        # Broadcast probabilities change via WebSocket EventBus
        event_bus = request.app.state.event_bus
        await event_bus.publish("PROBABILITIES_UPDATED")

        return APIResponse(data={
            "message": "Tournament live probabilities rebuilt successfully.",
            "completed_matches": len(matches),
            "timestamp": timestamp
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation rebuild failed: {str(e)}")
