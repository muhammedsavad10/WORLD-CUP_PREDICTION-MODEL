from abc import ABC, abstractmethod
from typing import List, Dict, Optional, Any
from app.domain.models import Match, ProbabilitySnapshot

class IResultsRepository(ABC):
    @abstractmethod
    def get_all_matches(self) -> List[Match]:
        """Retrieve all completed/live matches."""
        pass

    @abstractmethod
    def get_match_by_number(self, match_number: int) -> Optional[Match]:
        """Retrieve a specific match details by number."""
        pass

    @abstractmethod
    def save_match(self, match: Match) -> None:
        """Save/Update a match result."""
        pass

class IProbabilityRepository(ABC):
    @abstractmethod
    def get_all_probabilities(self) -> Dict[str, Dict[str, Any]]:
        """Retrieve the live probabilities for all teams."""
        pass

    @abstractmethod
    def get_probability_by_team(self, team_name: str) -> Optional[Dict[str, Any]]:
        """Retrieve probability metrics for a specific team."""
        pass

    @abstractmethod
    def get_timeline_history(self) -> List[ProbabilitySnapshot]:
        """Retrieve all recorded historical timeline snapshots."""
        pass

    @abstractmethod
    def save_snapshot(self, snapshot: ProbabilitySnapshot) -> None:
        """Append a new probability snapshot to the historical timeline."""
        pass

class IXAICacheRepository(ABC):
    @abstractmethod
    def get_explanation(self, cache_key: str) -> Optional[str]:
        """Fetch cached AI explanation by key."""
        pass

    @abstractmethod
    def save_explanation(self, cache_key: str, explanation: str, prompt_version: str) -> None:
        """Save AI explanation to cache with prompt versioning."""
        pass
