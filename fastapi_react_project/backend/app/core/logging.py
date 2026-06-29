import time
import logging
import uuid
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

# Configure standard JSON-compatible logging format
logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "message": %(message)s}',
    datefmt='%Y-%m-%dT%H:%M:%SZ'
)
logger = logging.getLogger("app")

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        start_time = time.time()
        method = request.method
        endpoint = request.url.path
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")
        
        response = None
        status_code = 500
        exception_msg = ""
        
        try:
            response = await call_next(request)
            status_code = response.status_code
            return response
        except Exception as e:
            exception_msg = str(e)
            raise e
        finally:
            duration = int((time.time() - start_time) * 1000)
            log_data = {
                "request_id": request_id,
                "ip": client_ip,
                "method": method,
                "endpoint": endpoint,
                "status_code": status_code,
                "duration_ms": duration,
                "user_agent": user_agent
            }
            if exception_msg:
                log_data["error"] = exception_msg
            
            import json
            logger.info(json.dumps(log_data))
