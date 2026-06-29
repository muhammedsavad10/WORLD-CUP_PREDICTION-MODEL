import os
import glob
from typing import Dict, List, Optional, Any
from pathlib import Path
from app.domain.models import ProbabilitySnapshot
from app.repositories.base import IProbabilityRepository
from app.repositories.json_base import JSONRepository

class JSONProbabilityRepository(JSONRepository, IProbabilityRepository):
    def __init__(self, file_path: str, snapshots_dir: str):
        super().__init__()
        self.file_path = file_path
        self.snapshots_dir = snapshots_dir

    def get_all_probabilities(self) -> Dict[str, Dict[str, Any]]:
        raw_data = self._read_json(self.file_path)
        if not raw_data or "probabilities" not in raw_data:
            return {}
        return raw_data["probabilities"]

    def get_probability_by_team(self, team_name: str) -> Optional[Dict[str, Any]]:
        probs = self.get_all_probabilities()
        return probs.get(team_name)

    def get_timeline_history(self) -> List[ProbabilitySnapshot]:
        snapshots_path = Path(self.snapshots_dir)
        if not snapshots_path.exists():
            return []
            
        json_files = sorted(glob.glob(os.path.join(self.snapshots_dir, "*.json")))
        snapshots = []
        for file in json_files:
            try:
                data = self._read_json(file)
                if data:
                    snapshots.append(ProbabilitySnapshot(**data))
            except Exception:
                pass
        return snapshots

    def save_snapshot(self, snapshot: ProbabilitySnapshot) -> None:
        # Convert timestamp to safe filename format (e.g., replace colons)
        ts_safe = snapshot.timestamp.replace(":", "-").replace("+", "_")
        filename = f"{ts_safe}.json"
        dest_path = os.path.join(self.snapshots_dir, filename)
        self._write_json(dest_path, snapshot.model_dump())
