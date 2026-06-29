import os
import datetime
from typing import List, Optional
from app.domain.models import Match
from app.repositories.base import IResultsRepository
from app.repositories.json_base import JSONRepository

class JSONResultsRepository(JSONRepository, IResultsRepository):
    def __init__(self, file_path: str):
        super().__init__()
        self.file_path = file_path

    def get_all_matches(self) -> List[Match]:
        raw_data = self._read_json(self.file_path)
        if not raw_data or "matches" not in raw_data:
            return []
        return [Match(**m) for m in raw_data["matches"]]

    def get_match_by_number(self, match_number: int) -> Optional[Match]:
        matches = self.get_all_matches()
        for m in matches:
            if m.match_number == match_number:
                return m
        return None

    def save_match(self, match: Match) -> None:
        raw_data = self._read_json(self.file_path) or {"last_updated": "", "matches": []}
        
        match_dict = match.model_dump()
        
        updated = False
        for idx, m in enumerate(raw_data.get("matches", [])):
            if m.get("match_number") == match.match_number:
                raw_data["matches"][idx] = match_dict
                updated = True
                break
        if not updated:
            raw_data.setdefault("matches", []).append(match_dict)
            
        raw_data["last_updated"] = datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%S+05:30")
        self._write_json(self.file_path, raw_data)
