from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class Match(BaseModel):
    match_number: int
    home_team: str
    away_team: str
    stage: str
    status: Optional[str] = None
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    winner: Optional[str] = None
    group: Optional[str] = None
    date: str

class Team(BaseModel):
    name: str
    rank: int
    group: str
    flag: str
    rolling_form: str
    goals_scored: int = 0
    goals_conceded: int = 0

class StandingsRow(BaseModel):
    team: str
    matches_played: int
    wins: int
    draws: int
    losses: int
    goals_scored: int
    goals_conceded: int
    goal_difference: int
    points: int
    qual_prob: float

class ProbabilitySnapshot(BaseModel):
    timestamp: str
    trigger: str
    version: str = "1.0.0"
    champion_probabilities: Dict[str, float]
    qualification_probabilities: Dict[str, float]
