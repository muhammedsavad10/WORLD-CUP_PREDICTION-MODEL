import sys
import os

# Insert backend directory with highest priority to avoid collisions
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../fastapi_react_project/backend")))
