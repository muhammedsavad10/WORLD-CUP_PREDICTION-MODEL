import pytest
import datetime
import json
import os
import pandas as pd
import numpy as np

from worldcup_engine.const import WCGroups, data_dir_path
from worldcup_engine.preprocess import load_data, get_match_features
from worldcup_engine.update_results import JSONLogisticRegressionModel
from worldcup_engine.tournament_simulator import TournamentSimulator

def test_deterministic_regression_bracket():
    # 1. Load coefficients
    model_json_path = os.path.join(data_dir_path, "logistic_regression_model.json")
    assert os.path.exists(model_json_path), f"Missing model: {model_json_path}"
    
    with open(model_json_path, "r", encoding="utf-8") as f:
        model_data = json.load(f)
    model = JSONLogisticRegressionModel(model_data)

    # 2. Load rankings
    _, _, rankings_df = load_data()

    # 3. Load completed matches
    results_path = os.path.join(data_dir_path, "world_cup_2026_live_results.json")
    assert os.path.exists(results_path)
    with open(results_path, "r", encoding="utf-8") as f:
        results_data = json.load(f)
    completed_matches = results_data.get("matches", [])

    completed_group_lookup = {}
    completed_ko_lookup = {}
    
    for m in completed_matches:
        if m.get("stage") == "group_stage":
            completed_group_lookup[(m["home_team"], m["away_team"])] = m
            completed_group_lookup[(m["away_team"], m["home_team"])] = m
        match_num = m.get("match_number")
        if match_num:
            completed_ko_lookup[int(match_num)] = m

    # 4. Feature generator
    def feature_generator(t1, t2):
        return get_match_features(t1, t2, rankings_df)

    # 5. Run multiple simulations and verify they are 100% identical and deterministic
    brackets = []
    champions = []

    for run_idx in range(3):
        # Fresh simulator instance
        simulator = TournamentSimulator(
            datetime.date(2026, 6, 11),
            model,
            WCGroups,
            feature_generator
        )
        simulator.gamma = 0.15
        simulator.prob_cap = 0.12
        simulator.probabilistic = False # Deterministic mode
        simulator.recorded_matchups = []

        group_results, advancing_thirds = simulator.playGroupStage(
            start_date=datetime.date(2026, 6, 11),
            completed_lookup=completed_group_lookup
        )

        round_results, labels, odds = simulator.playKnockOuts(
            group_results=group_results,
            advancing_thirds_mapping=advancing_thirds,
            completed_lookup=completed_ko_lookup
        )

        brackets.append(round_results)
        champions.append(round_results['final'][0])

    # Assert that all runs produce identical results (deterministic walk)
    assert champions[0] == champions[1] == champions[2]
    assert brackets[0] == brackets[1] == brackets[2]

    # Verify that champion matches the deterministic walk outcome on the current dataset
    assert champions[0] == "Spain"
