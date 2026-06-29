import pytest

def test_normalize_team_name():
    from worldcup_engine.update_results import normalize_team_name
    assert normalize_team_name("United States") == "USA"
    assert normalize_team_name("Korea Republic") == "South Korea"
    assert normalize_team_name("Brazil") == "Brazil"

def test_get_stage_by_match_num():
    from worldcup_engine.update_results import get_stage_by_match_num
    assert get_stage_by_match_num(10) == "group_stage"
    assert get_stage_by_match_num(75) == "round_of_32"
    assert get_stage_by_match_num(90) == "round_of_16"
    assert get_stage_by_match_num(98) == "quarter_final"
    assert get_stage_by_match_num(102) == "semi_final"
    assert get_stage_by_match_num(103) == "third_place"
    assert get_stage_by_match_num(104) == "final"

def test_calculate_rolling_form():
    from worldcup_engine.live_results_manager import calculate_rolling_form
    mock_matches = [
        {"home_team": "Brazil", "away_team": "Germany", "home_score": 2, "away_score": 1, "date": "2026-06-11"},
        {"home_team": "Germany", "away_team": "Brazil", "home_score": 1, "away_score": 1, "date": "2026-06-15"}
    ]
    form = calculate_rolling_form(mock_matches)
    assert form["Brazil"] == "WD"
    assert form["Germany"] == "LD"
