import datetime
from typing import Dict, Any, List
from app.repositories.base import IResultsRepository
from app.domain.models import Match
from worldcup_engine.tournament_simulator import TournamentSimulator
from worldcup_engine.const import WCGroups

class SimulationService:
    def __init__(
        self,
        results_repo: IResultsRepository,
        model: Any,
        rankings_df: Any
    ):
        self.results_repo = results_repo
        self.model = model
        self.rankings_df = rankings_df

    def run_single_simulation(self) -> Dict[str, Any]:
        # Get completed matches
        matches = self.results_repo.get_all_matches()
        
        # Build lookup tables for group stage and knockouts
        completed_group_lookup = {}
        completed_ko_lookup = {}
        
        for m in matches:
            m_dict = m.model_dump()
            if m.stage == "group_stage":
                completed_group_lookup[(m.home_team, m.away_team)] = m_dict
                completed_group_lookup[(m.away_team, m.home_team)] = m_dict
            else:
                completed_ko_lookup[int(m.match_number)] = m_dict

        # Feature generator func
        from worldcup_engine.preprocess import get_match_features
        def feature_generator(t1, t2):
            return get_match_features(t1, t2, self.rankings_df)

        # Initialize simulator
        simulator = TournamentSimulator(
            datetime.date(2026, 6, 11),
            self.model,
            WCGroups,
            feature_generator
        )
        simulator.gamma = 0.15
        simulator.prob_cap = 0.12
        simulator.probabilistic = False # Run deterministic walk matching original Streamlit
        simulator.recorded_matchups = []

        # Run group stage
        group_results, advancing_thirds = simulator.playGroupStage(
            start_date=datetime.date(2026, 6, 11),
            completed_lookup=completed_group_lookup
        )

        # Run knockouts
        round_results, labels, odds = simulator.playKnockOuts(
            group_results=group_results,
            advancing_thirds_mapping=advancing_thirds,
            completed_lookup=completed_ko_lookup
        )

        # Map simulator.recorded_matchups to structured stages
        # Play order: Matches 73-102, then 104, then 103
        play_order = list(range(73, 103)) + [104, 103]
        matchups = {}
        
        for idx, match_id in enumerate(play_order):
            if idx < len(simulator.recorded_matchups):
                stage, t1, t2 = simulator.recorded_matchups[idx]
                label = labels[idx]
                odd_pair = odds[idx]
                matchups[str(match_id)] = {
                    "stage": stage,
                    "home_team": t1,
                    "away_team": t2,
                    "home_probability": round(float(odd_pair[0]) * 100, 2),
                    "away_probability": round(float(odd_pair[1]) * 100, 2),
                    "label": label,
                    "winner": simulator.match_winners[match_id]
                }

        # Let's resolve the actual winner values from match_winners list inside simulation
        # Wait, the play order returns round_results with lists of winners.
        # Let's do a more precise winner resolution based on match_id mapping.
        # We can map each match_id to its actual simulated winner:
        # In tournament_simulator, playKnockOuts loops and writes to round_results[stage].append(winner).
        # We can reconstruct it simply:
        # Match 104 winner is Champion.
        # Match 103 winner is Third Place.
        # Match 101/102 winners go to Final.
        
        # Let's build a clean list of match nodes for the frontend tree
        bracket_tree = {}
        for match_id in play_order:
            # Look up simulated values
            m_data = matchups.get(str(match_id))
            if m_data:
                bracket_tree[str(match_id)] = m_data

        return {
            "bracket": bracket_tree,
            "champion": bracket_tree["104"]["winner"] if "104" in bracket_tree else "Unknown"
        }
