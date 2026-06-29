import sqlite3
import os
from typing import Optional
from app.repositories.base import IXAICacheRepository

class SQLiteXAICacheRepository(IXAICacheRepository):
    def __init__(self, db_path: str):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        db_dir = os.path.dirname(self.db_path)
        if db_dir:
            os.makedirs(db_dir, exist_ok=True)
        
        conn = sqlite3.connect(self.db_path)
        with conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS xai_cache (
                    cache_key TEXT PRIMARY KEY,
                    explanation TEXT NOT NULL,
                    prompt_version TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_created_at ON xai_cache(created_at);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_prompt_version ON xai_cache(prompt_version);")
        conn.close()

    def get_explanation(self, cache_key: str) -> Optional[str]:
        # Return explanation, created_at and version (or verify expiration in service layer)
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT explanation, created_at, prompt_version FROM xai_cache WHERE cache_key = ?", (cache_key,))
            row = cursor.fetchone()
            if row:
                return row["explanation"]
        except Exception:
            pass
        finally:
            conn.close()
        return None

    def save_explanation(self, cache_key: str, explanation: str, prompt_version: str) -> None:
        conn = sqlite3.connect(self.db_path)
        try:
            with conn:
                conn.execute(
                    "INSERT OR REPLACE INTO xai_cache (cache_key, explanation, prompt_version, created_at) VALUES (?, ?, ?, datetime('now'));",
                    (cache_key, explanation, prompt_version)
                )
        except Exception:
            pass
        finally:
            conn.close()
