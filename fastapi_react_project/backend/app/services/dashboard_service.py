import os
import json
import datetime
from typing import Dict, List, Any
import numpy as np
from app.domain.models import Match
from app.repositories.base import IResultsRepository, IProbabilityRepository
from app.core.config import settings

class DashboardService:
    def __init__(
        self,
        results_repo: IResultsRepository,
        prob_repo: IProbabilityRepository,
        model: Any,
        rankings_df: Any
    ):
        self.results_repo = results_repo
        self.prob_repo = prob_repo
        self.model = model
        self.rankings_df = rankings_df

    def get_dashboard_summary(self) -> Dict[str, Any]:
        matches = self.results_repo.get_all_matches()
        live_probs = self.prob_repo.get_all_probabilities()
        
        # Load baseline probabilities from settings path
        baseline_probs = {}
        if os.path.exists(settings.BASELINE_PROBABILITIES_JSON_PATH):
            try:
                with open(settings.BASELINE_PROBABILITIES_JSON_PATH, "r", encoding="utf-8") as f:
                    baseline_probs = json.load(f)
            except Exception:
                pass

        completed_count = len(matches)
        remaining_count = max(0, 104 - completed_count)
        
        # Get last updated time
        last_updated = "2026-06-11T00:00:00Z"
        if os.path.exists(settings.RESULTS_JSON_PATH):
            try:
                with open(settings.RESULTS_JSON_PATH, "r", encoding="utf-8") as f:
                    last_updated = json.load(f).get("last_updated", last_updated)
            except Exception:
                pass
                
        try:
            clean_ts = last_updated.replace("Z", "+00:00")
            dt = datetime.datetime.fromisoformat(clean_ts)
            last_updated_display = dt.strftime("%B %d, %Y")
        except Exception:
            last_updated_display = last_updated[:10]
            
        # Calculate model accuracy
        total_pred, correct_pred, accuracy_pct = self._calculate_model_accuracy(matches)
        
        # Sort and take top 10 championship odds
        top_odds = []
        if live_probs:
            sorted_champs = sorted(live_probs.items(), key=lambda x: x[1].get("champion", 0.0), reverse=True)[:10]
            top_odds = [{"team": team, "probability": round(metrics.get("champion", 0.0) * 100, 2)} for team, metrics in sorted_champs]

        # Calculate momentum (risers/fallers)
        momentum = self._calculate_momentum(matches, live_probs, baseline_probs)
        
        return {
            "matches_completed": completed_count,
            "matches_remaining": remaining_count,
            "model_accuracy": f"{accuracy_pct:.1f}%",
            "correct_predictions": correct_pred,
            "total_predictions": total_pred,
            "last_updated": last_updated_display,
            "top_odds": top_odds,
            "momentum": momentum
        }

    def _calculate_model_accuracy(self, matches: List[Match]) -> tuple:
        correct_count = 0
        total_count = 0
        
        from worldcup_engine.preprocess import get_match_features
        
        for match in matches:
            home_team = match.home_team
            away_team = match.away_team
            winner = match.winner
            
            # Predict match outcome using ML coefficients loaded in lifespan
            feat = get_match_features(home_team, away_team, self.rankings_df)
            probs = self.model.predict_proba([feat])[0]
            prob_home, prob_away = float(probs[1]), float(probs[0])
            
            if prob_home > prob_away:
                pred_winner = home_team
            elif prob_away > prob_home:
                pred_winner = away_team
            else:
                pred_winner = "Draw"
                
            actual_winner = winner if winner != "Draw" and winner is not None else "Draw"
            if pred_winner == actual_winner:
                correct_count += 1
            total_count += 1
            
        percentage = (correct_count / total_count * 100) if total_count > 0 else 0.0
        return total_count, correct_count, percentage

    def _calculate_momentum(self, matches: List[Match], live_probs: Dict[str, Any], baseline_probs: Dict[str, Any]) -> Dict[str, Any]:
        played_teams = set()
        last_results = {}
        for m in matches:
            t1 = m.home_team
            t2 = m.away_team
            played_teams.add(t1)
            played_teams.add(t2)
            
            winner = m.winner
            h_score = m.home_score
            a_score = m.away_score
            
            if winner == "Draw" or winner is None or h_score == a_score:
                last_results[t1] = 'draw'
                last_results[t2] = 'draw'
            elif winner == t1:
                last_results[t1] = 'win'
                last_results[t2] = 'loss'
            elif winner == t2:
                last_results[t1] = 'loss'
                last_results[t2] = 'win'
                
        risers = []
        fallers = []
        
        for team in live_probs:
            curr = live_probs[team]["champion"]
            base = baseline_probs.get(team, {}).get("champion", curr)
            delta = curr - base
            
            # Statistical significance checking (using 10,000 runs baseline)
            p_bound = max(0.001, min(0.999, base))
            se_base = np.sqrt(p_bound * (1 - p_bound) / 10000)
            se_curr = np.sqrt(curr * (1 - curr) / 10000) if curr > 0 else 0
            se_diff = np.sqrt(se_base**2 + se_curr**2)
            ci = 1.96 * se_diff
            
            if abs(delta) > ci and abs(delta) >= 0.001:
                last_res = last_results.get(team)
                if delta > 0:
                    if last_res != 'loss':
                        risers.append({"team": team, "change": f"+{delta*100:.2f}%", "outcome": last_res or "none"})
                else:
                    if last_res != 'win':
                        fallers.append({"team": team, "change": f"{delta*100:.2f}%", "outcome": last_res or "none"})
                        
        sorted_risers = sorted(risers, key=lambda x: float(x["change"].replace("%", "")), reverse=True)[:4]
        sorted_fallers = sorted(fallers, key=lambda x: float(x["change"].replace("%", "")))[:4]
        
        return {
            "risers": sorted_risers,
            "fallers": sorted_fallers
        }
