import os
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Optional

@dataclass
class CachedFile:
    path: Path
    mtime: float
    data: Any

class JSONRepository:
    _global_cache: dict[str, CachedFile] = {}

    def __init__(self):
        pass

    def _read_json(self, file_path: str) -> Any:
        path = Path(file_path)
        if not path.exists():
            return None
        
        mtime = os.path.getmtime(path)
        cache_key = str(path.resolve())
        
        # Check cache validity
        if cache_key in JSONRepository._global_cache:
            cached = JSONRepository._global_cache[cache_key]
            if cached.mtime == mtime:
                return cached.data
                
        # Load from disk
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        # Cache results
        JSONRepository._global_cache[cache_key] = CachedFile(path=path, mtime=mtime, data=data)
        return data

    def _write_json(self, file_path: str, data: Any) -> None:
        path = Path(file_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, sort_keys=True)
            
        # Update cache state immediately
        mtime = os.path.getmtime(path)
        cache_key = str(path.resolve())
        JSONRepository._global_cache[cache_key] = CachedFile(path=path, mtime=mtime, data=data)
