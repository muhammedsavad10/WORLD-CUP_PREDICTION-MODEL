from typing import List, Optional, Dict, Any
from app.domain.models import Match
from app.repositories.base import IResultsRepository

class MatchService:
    def __init__(self, results_repo: IResultsRepository, model: Any, rankings_df: Any):
        self.results_repo = results_repo
        self.model = model
        self.rankings_df = rankings_df

    def get_all_matches(self) -> List[Match]:
        return self.results_repo.get_all_matches()

    def get_match_by_number(self, match_number: int) -> Optional[Match]:
        return self.results_repo.get_match_by_number(match_number)

    def get_group_standings(self) -> Dict[str, List[Dict[str, Any]]]:
        matches = self.results_repo.get_all_matches()
        matches_dict_list = [m.model_dump() for m in matches]
        import worldcup_engine.live_results_manager as live_results_manager
        return live_results_manager.calculate_group_tables(matches_dict_list, self.rankings_df)

    def get_valid_h2h_fixtures(self) -> List[Dict[str, Any]]:
        import datetime
        from worldcup_engine.const import WCGroups
        from worldcup_engine.tournament_simulator import TournamentSimulator
        from worldcup_engine.preprocess import get_match_features

        # 1. Generate Group Stage round-robin fixtures
        group_fixtures = []
        group_letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
        for g_idx, group in enumerate(WCGroups):
            g_letter = group_letters[g_idx]
            for i in range(len(group)):
                for j in range(i + 1, len(group)):
                    group_fixtures.append({
                        "stage": f"Group Stage: [Group {g_letter}]",
                        "home_team": group[i],
                        "away_team": group[j],
                        "label": f"Group Stage: [Group {g_letter}] {group[i]} vs {group[j]}"
                    })

        # 2. Run deterministic simulation to get knockout fixtures
        def feature_generator(t1, t2):
            return get_match_features(t1, t2, self.rankings_df)

        simulator = TournamentSimulator(
            datetime.date(2026, 6, 11),
            self.model,
            WCGroups,
            feature_generator
        )
        simulator.gamma = 0.15
        simulator.prob_cap = 0.12
        simulator.probabilistic = False
        simulator.recorded_matchups = []

        matches = self.results_repo.get_all_matches()
        completed_group_lookup = {}
        completed_ko_lookup = {}
        for m in matches:
            m_dict = m.model_dump()
            if m.stage == "group_stage":
                completed_group_lookup[(m.home_team, m.away_team)] = m_dict
                completed_group_lookup[(m.away_team, m.home_team)] = m_dict
            else:
                completed_ko_lookup[int(m.match_number)] = m_dict

        group_results, advancing_thirds = simulator.playGroupStage(
            start_date=datetime.date(2026, 6, 11),
            completed_lookup=completed_group_lookup
        )

        round_results, labels, odds = simulator.playKnockOuts(
            group_results=group_results,
            advancing_thirds_mapping=advancing_thirds,
            completed_lookup=completed_ko_lookup
        )

        knockout_fixtures = []
        for stage, t1, t2 in simulator.recorded_matchups:
            stage_name = stage.replace("_", " ").title()
            knockout_fixtures.append({
                "stage": stage_name,
                "home_team": t1,
                "away_team": t2,
                "label": f"{stage_name}: {t1} vs {t2}"
            })

        return group_fixtures + knockout_fixtures

    def get_h2h_prediction(self, home_team: str, away_team: str) -> Dict[str, float]:
        # Validate that the matchup is a valid fixture in the tournament
        valid_fixtures = self.get_valid_h2h_fixtures()
        is_valid = any(
            (f["home_team"] == home_team and f["away_team"] == away_team) or
            (f["home_team"] == away_team and f["away_team"] == home_team)
            for f in valid_fixtures
        )
        if not is_valid:
            raise ValueError(f"Matchup between {home_team} and {away_team} is not a valid tournament fixture.")

        from worldcup_engine.preprocess import get_match_features
        feat = get_match_features(home_team, away_team, self.rankings_df)
        probs = self.model.predict_proba([feat])[0]
        prob_home, prob_away = float(probs[1]), float(probs[0])
        return {
            "home_probability": round(prob_home * 100, 2),
            "away_probability": round(prob_away * 100, 2)
        }

    def save_match_result(self, match: Match) -> None:
        self.results_repo.save_match(match)
