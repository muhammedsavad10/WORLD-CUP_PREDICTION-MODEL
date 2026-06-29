from typing import Set
from fastapi import WebSocket

class EventBus:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def publish(self, event_type: str):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(event_type)
            except Exception:
                disconnected.append(connection)
                
        for connection in disconnected:
            self.disconnect(connection)
