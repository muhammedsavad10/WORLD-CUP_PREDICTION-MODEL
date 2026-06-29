from pydantic import BaseModel, Field
from typing import Any
import datetime

def utc_now_iso() -> str:
    return datetime.datetime.utcnow().isoformat() + "Z"

class APIResponse(BaseModel):
    success: bool = True
    data: Any
    timestamp: str = Field(default_factory=utc_now_iso)
    version: str = "1.0.0"

class ErrorDetail(BaseModel):
    code: str
    message: str

class ErrorResponse(BaseModel):
    success: bool = False
    error: ErrorDetail
    timestamp: str = Field(default_factory=utc_now_iso)
    version: str = "1.0.0"
