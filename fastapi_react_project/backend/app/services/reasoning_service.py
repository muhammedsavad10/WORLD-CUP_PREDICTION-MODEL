import os
import json
import hashlib
from typing import Dict, Any, Optional
from fastapi import BackgroundTasks
from app.repositories.base import IResultsRepository, IProbabilityRepository, IXAICacheRepository
from app.domain.models import Match
from app.core.config import settings
from app.core.events import EventBus

# Import reasoning_agent from worldcup_engine package
from worldcup_engine.reasoning_agent import MatchAnalysisContext, generate_match_analysis, get_match_state, build_evidence_summary, MatchState
from worldcup_engine.news_provider import fetch_live_team_news
from worldcup_engine.config import PROMPT_VERSION, FORECAST_VERSION, MODEL_VERSION

class ReasoningService:
    def __init__(
        self,
        results_repo: IResultsRepository,
        prob_repo: IProbabilityRepository,
        cache_repo: IXAICacheRepository,
        event_bus: EventBus,
        rankings_df: Any,
        model: Any
    ):
        self.results_repo = results_repo
        self.prob_repo = prob_repo
        self.cache_repo = cache_repo
        self.event_bus = event_bus
        self.rankings_df = rankings_df
        self.model = model

    def get_match_explanation(
        self,
        match_number: int,
        background_tasks: BackgroundTasks
    ) -> Dict[str, Any]:
        match_obj = self.results_repo.get_match_by_number(match_number)
        if not match_obj:
            return {
                "status": "not_found",
                "explanation": "Match not found.",
                "evidence_quality": "N/A",
                "completeness": "N/A"
            }

        t1_name = match_obj.home_team
        t2_name = match_obj.away_team
        
        from preprocess import get_match_features
        feat = get_match_features(t1_name, t2_name, self.rankings_df)
        probs = self.model.predict_proba([feat])[0]
        t1_prob, t2_prob = float(probs[1]), float(probs[0])
        
        team_a_rank = feat[0]
        team_b_rank = feat[1]
        team_a_form = feat[3]
        team_b_form = feat[4]
        team_a_goals = feat[5]
        team_b_goals = feat[6]
        rank_diff = team_a_rank - team_b_rank
        form_diff = team_a_form - team_b_form
        goals_diff = team_a_goals - team_b_goals

        match_record = match_obj.model_dump()
        state = get_match_state(match_record)

        live_probs = self.prob_repo.get_all_probabilities()
        
        baseline_probs = self.prob_repo._read_json(settings.BASELINE_PROBABILITIES_JSON_PATH) or {}

        probabilities_impact = None
        if state == MatchState.COMPLETED:
            probabilities_impact = {
                "team_a_baseline_champ": baseline_probs.get(t1_name, {}).get("champion", 0.0) * 100,
                "team_a_current_champ": live_probs.get(t1_name, {}).get("champion", 0.0) * 100,
                "team_b_baseline_champ": baseline_probs.get(t2_name, {}).get("champion", 0.0) * 100,
                "team_b_current_champ": live_probs.get(t2_name, {}).get("champion", 0.0) * 100,
                "team_a_baseline_qual": baseline_probs.get(t1_name, {}).get("group_qual", 0.0) * 100,
                "team_a_current_qual": live_probs.get(t1_name, {}).get("group_qual", 0.0) * 100,
                "team_b_baseline_qual": baseline_probs.get(t2_name, {}).get("group_qual", 0.0) * 100,
                "team_b_current_qual": live_probs.get(t2_name, {}).get("group_qual", 0.0) * 100
            }

        raw_results = self.results_repo._read_json(settings.RESULTS_JSON_PATH)
        last_updated = raw_results.get("last_updated", "2026-06-11")[:10] if raw_results else "2026-06-11"

        evidence_level = "N/A"
        evidence_completeness = "N/A"
        if state == MatchState.COMPLETED:
            quality, completeness_str, _, _ = build_evidence_summary(
                MatchAnalysisContext(
                    team_a=t1_name, team_b=t2_name, prob_a=t1_prob*100, prob_b=t2_prob*100,
                    rank_diff=rank_diff, form_diff=form_diff, goals_diff=goals_diff,
                    match_record=match_record, probabilities_impact=probabilities_impact
                )
            )
            evidence_level = quality
            evidence_completeness = completeness_str

        status_str = match_record.get("status", "UNKNOWN") if match_record else "FUTURE"
        home_score = match_record.get("home_score", 0) if match_record else 0
        away_score = match_record.get("away_score", 0) if match_record else 0
        
        news_hash = hashlib.md5("".encode()).hexdigest()[:6]
        cache_key = f"{state.name.lower()}_{t1_name}_{t2_name}_{home_score}_{away_score}_{status_str}_{evidence_level}_{PROMPT_VERSION}_{FORECAST_VERSION}_{MODEL_VERSION}_{news_hash}"

        # Look in repository cache
        explanation = self.cache_repo.get_explanation(cache_key)
        if explanation:
            return {
                "status": "completed",
                "explanation": explanation,
                "evidence_quality": evidence_level,
                "completeness": evidence_completeness
            }

        # Cache Miss - Trigger background task
        background_tasks.add_task(
            self._async_generate_explanation,
            t1_name=t1_name,
            t2_name=t2_name,
            t1_prob=t1_prob,
            t2_prob=t2_prob,
            rank_diff=rank_diff,
            form_diff=form_diff,
            goals_diff=goals_diff,
            match_record=match_record,
            probabilities_impact=probabilities_impact,
            last_updated=last_updated,
            cache_key=cache_key
        )

        return {
            "status": "pending",
            "explanation": "AI reasoning analysis is in progress. The Reasoning Agent is evaluating tactical form metrics and fetching latest news context...",
            "evidence_quality": evidence_level,
            "completeness": evidence_completeness
        }

    def _async_generate_explanation(
        self,
        t1_name: str,
        t2_name: str,
        t1_prob: float,
        t2_prob: float,
        rank_diff: float,
        form_diff: float,
        goals_diff: float,
        match_record: dict,
        probabilities_impact: Optional[dict],
        last_updated: str,
        cache_key: str
    ):
        try:
            # Pass Groq api key to environment variable dynamically
            os.environ["GROQ_API_KEY"] = settings.GROQ_API_KEY
            
            # Execute news fetching logic synchronously inside background thread
            team_a_news = fetch_live_team_news(t1_name)
            team_b_news = fetch_live_team_news(t2_name)
            
            context = MatchAnalysisContext(
                team_a=t1_name,
                team_b=t2_name,
                prob_a=t1_prob * 100,
                prob_b=t2_prob * 100,
                rank_diff=rank_diff,
                form_diff=form_diff,
                goals_diff=goals_diff,
                current_phase="pre_tournament",
                match_record=match_record,
                probabilities_impact=probabilities_impact,
                team_a_news=team_a_news,
                team_b_news=team_b_news,
                forecast_date=last_updated,
                live_results_version=f"Matchday {match_record.get('match_number')}",
                match_events=match_record.get("match_events"),
                verified_statistics=match_record.get("verified_statistics")
            )
            
            explanation = generate_match_analysis(context)
            self.cache_repo.save_explanation(cache_key, explanation, PROMPT_VERSION)
            
            # BroadcastWebSocket event
            import asyncio
            asyncio.run(self.event_bus.publish("NEW_EXPLANATION"))
        except Exception:
            pass

    def is_valid_matchup(self, home_team: str, away_team: str) -> bool:
        from worldcup_engine.const import WCGroups
        for group in WCGroups:
            if home_team in group and away_team in group:
                return True
                
        import datetime
        from worldcup_engine.tournament_simulator import TournamentSimulator
        from worldcup_engine.preprocess import get_match_features
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

        simulator.playKnockOuts(
            group_results=group_results,
            advancing_thirds_mapping=advancing_thirds,
            completed_lookup=completed_ko_lookup
        )

        for stage, t1, t2 in simulator.recorded_matchups:
            if (t1 == home_team and t2 == away_team) or (t1 == away_team and t2 == home_team):
                return True
        return False

    def get_h2h_explanation(
        self,
        home_team: str,
        away_team: str,
        background_tasks: BackgroundTasks
    ) -> Dict[str, Any]:
        if not self.is_valid_matchup(home_team, away_team):
            return {
                "status": "error",
                "explanation": f"Matchup between {home_team} and {away_team} is not a valid tournament fixture.",
                "evidence_quality": "N/A",
                "completeness": "N/A"
            }

        cache_key = f"h2h_{home_team}_{away_team}_{PROMPT_VERSION}_{FORECAST_VERSION}_{MODEL_VERSION}"
        explanation = self.cache_repo.get_explanation(cache_key)
        if explanation:
            return {
                "status": "completed",
                "explanation": explanation,
                "evidence_quality": "High",
                "completeness": "Complete"
            }

        from worldcup_engine.preprocess import get_match_features
        feat = get_match_features(home_team, away_team, self.rankings_df)
        probs = self.model.predict_proba([feat])[0]
        t1_prob, t2_prob = float(probs[1]), float(probs[0])
        
        team_a_rank = feat[0]
        team_b_rank = feat[1]
        team_a_form = feat[3]
        team_b_form = feat[4]
        team_a_goals = feat[5]
        team_b_goals = feat[6]
        rank_diff = team_a_rank - team_b_rank
        form_diff = team_a_form - team_b_form
        goals_diff = team_a_goals - team_b_goals

        match_record = {
            "match_number": 0,
            "home_team": home_team,
            "away_team": away_team,
            "stage": "h2h_simulation",
            "status": "FUTURE",
            "home_score": 0,
            "away_score": 0
        }

        last_updated = "2026-06-11"
        raw_results = self.results_repo._read_json(settings.RESULTS_JSON_PATH)
        if raw_results:
            last_updated = raw_results.get("last_updated", last_updated)[:10]

        # Trigger background generation
        background_tasks.add_task(
            self._async_generate_explanation,
            t1_name=home_team,
            t2_name=away_team,
            t1_prob=t1_prob,
            t2_prob=t2_prob,
            rank_diff=rank_diff,
            form_diff=form_diff,
            goals_diff=goals_diff,
            match_record=match_record,
            probabilities_impact=None,
            last_updated=last_updated,
            cache_key=cache_key
        )

        return {
            "status": "pending",
            "explanation": "AI reasoning analysis is in progress. The Reasoning Agent is evaluating tactical form metrics and fetching latest news context...",
            "evidence_quality": "High",
            "completeness": "Pending"
        }

    def get_h2h_status(self, home_team: str, away_team: str) -> Dict[str, Any]:
        cache_key = f"h2h_{home_team}_{away_team}_{PROMPT_VERSION}_{FORECAST_VERSION}_{MODEL_VERSION}"
        explanation = self.cache_repo.get_explanation(cache_key)
        if explanation:
            return {
                "status": "completed",
                "analysis": explanation
            }
        return {
            "status": "pending"
        }
