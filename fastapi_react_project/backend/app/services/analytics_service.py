from typing import Dict, List, Any
import numpy as np
from app.repositories.base import IResultsRepository

class AnalyticsService:
    def __init__(self, results_repo: IResultsRepository, model: Any, rankings_df: Any):
        self.results_repo = results_repo
        self.model = model
        self.rankings_df = rankings_df

    def get_analytics_metrics(self) -> Dict[str, Any]:
        matches = self.results_repo.get_all_matches()
        
        completed_matches = [m for m in matches if m.status == "COMPLETED" or m.winner is not None]
        completed_matches = sorted(completed_matches, key=lambda x: x.match_number)

        if not completed_matches:
            return {
                "total_predictions": 0,
                "correct_predictions": 0,
                "incorrect_predictions": 0,
                "average_confidence": 0.0,
                "overall_brier_score": 0.0,
                "rolling_accuracy": [],
                "confidence_histogram": [],
                "calibration_curve": []
            }

        from worldcup_engine.preprocess import get_match_features
        
        predictions = []
        correct_count = 0
        total_count = 0
        brier_sum = 0.0
        rolling_accuracy = []

        bins = {"50-60": 0, "60-70": 0, "70-80": 0, "80-90": 0, "90-100": 0}
        bin_outcomes = {"50-60": [], "60-70": [], "70-80": [], "80-90": [], "90-100": []}

        for match in completed_matches:
            home_team = match.home_team
            away_team = match.away_team
            winner = match.winner
            
            feat = get_match_features(home_team, away_team, self.rankings_df)
            probs = self.model.predict_proba([feat])[0]
            prob_home, prob_away = float(probs[1]), float(probs[0])
            
            if prob_home > prob_away:
                pred_winner = home_team
                confidence = prob_home
            elif prob_away > prob_home:
                pred_winner = away_team
                confidence = prob_away
            else:
                pred_winner = "Draw"
                confidence = 0.5
                
            actual_winner = winner if winner != "Draw" and winner is not None else "Draw"
            is_correct = (pred_winner == actual_winner)
            if is_correct:
                correct_count += 1
            total_count += 1
            
            rolling_accuracy.append({
                "match_number": match.match_number,
                "accuracy": round((correct_count / total_count) * 100, 2)
            })

            # Brier Score formula: sum of square differences
            if actual_winner == home_team:
                o_home, o_away = 1.0, 0.0
            elif actual_winner == away_team:
                o_home, o_away = 0.0, 1.0
            else:
                o_home, o_away = 0.5, 0.5
                
            match_brier = ((prob_home - o_home) ** 2 + (prob_away - o_away) ** 2) / 2
            brier_sum += match_brier
            
            conf_pct = confidence * 100
            if 50 <= conf_pct < 60:
                bin_key = "50-60"
            elif 60 <= conf_pct < 70:
                bin_key = "60-70"
            elif 70 <= conf_pct < 80:
                bin_key = "70-80"
            elif 80 <= conf_pct < 90:
                bin_key = "80-90"
            else:
                bin_key = "90-100"
                
            bins[bin_key] += 1
            outcome_val = 1.0 if pred_winner == actual_winner else 0.0
            bin_outcomes[bin_key].append((confidence, outcome_val))
            predictions.append(confidence)

        avg_confidence = round((sum(predictions) / len(predictions)) * 100, 2) if predictions else 0.0
        overall_brier = round(brier_sum / len(completed_matches), 4)

        confidence_histogram = []
        for bin_name, outcomes in bin_outcomes.items():
            correct = sum(1 for x in outcomes if x[1] == 1.0)
            incorrect = len(outcomes) - correct
            confidence_histogram.append({
                "bin": bin_name,
                "correct": correct,
                "incorrect": incorrect,
                "count": len(outcomes)
            })

        calibration_curve = []
        for bin_name, items in bin_outcomes.items():
            if items:
                avg_pred = sum(x[0] for x in items) / len(items)
                avg_act = sum(x[1] for x in items) / len(items)
                calibration_curve.append({
                    "bin": bin_name,
                    "predicted": round(avg_pred * 100, 2),
                    "actual": round(avg_act * 100, 2),
                    "count": len(items)
                })
            else:
                midpoint = float(bin_name.split("-")[0]) + 5
                calibration_curve.append({
                    "bin": bin_name,
                    "predicted": midpoint,
                    "actual": 0.0,
                    "count": 0
                })

        return {
            "total_predictions": total_count,
            "correct_predictions": correct_count,
            "incorrect_predictions": total_count - correct_count,
            "average_confidence": avg_confidence,
            "overall_brier_score": overall_brier,
            "rolling_accuracy": rolling_accuracy,
            "confidence_histogram": confidence_histogram,
            "calibration_curve": calibration_curve
        }
