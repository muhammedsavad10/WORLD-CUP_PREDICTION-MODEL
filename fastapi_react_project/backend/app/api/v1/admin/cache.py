import sqlite3
from fastapi import APIRouter, HTTPException
from app.schemas.response import APIResponse
from app.core.config import settings

router = APIRouter(tags=["Admin - Cache"])

@router.post("/flush", response_model=APIResponse)
async def flush_cache():
    try:
        conn = sqlite3.connect(settings.SQLITE_DB_PATH)
        with conn:
            conn.execute("DELETE FROM xai_cache;")
        conn.close()
        return APIResponse(data={"message": "XAI cache database flushed successfully."})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.post("/flush-repository", response_model=APIResponse)
async def flush_repository_ram_cache():
    try:
        from app.repositories.json_base import JSONRepository
        JSONRepository._global_cache.clear()
        return APIResponse(data={"message": "Repository RAM cache cleared successfully."})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cache clear failed: {str(e)}")

@router.post("/flush-db-cache", response_model=APIResponse)
async def flush_db_cache():
    try:
        conn = sqlite3.connect(settings.SQLITE_DB_PATH)
        with conn:
            conn.execute("DELETE FROM xai_cache;")
        conn.close()
        return APIResponse(data={"message": "SQLite XAI cache database flushed successfully."})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database clear failed: {str(e)}")
