import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

def test_get_dashboard(client):
    response = client.get("/api/v1/public/dashboard")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert "matches_completed" in json_data["data"]
    assert "matches_remaining" in json_data["data"]
    assert "model_accuracy" in json_data["data"]

def test_get_matches(client):
    response = client.get("/api/v1/public/matches")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert isinstance(json_data["data"], list)
    if len(json_data["data"]) > 0:
        match = json_data["data"][0]
        assert "match_number" in match
        assert "home_team" in match
        assert "away_team" in match

def test_get_system_status(client):
    response = client.get("/api/v1/public/system/status")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert json_data["data"]["status"] == "healthy"

def test_get_model_analytics(client):
    response = client.get("/api/v1/public/system/analytics")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert "rolling_accuracy" in json_data["data"]
    assert "confidence_histogram" in json_data["data"]

def test_get_standings(client):
    response = client.get("/api/v1/public/matches/standings")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert "A" in json_data["data"]
    assert len(json_data["data"]["A"]) == 4

def test_get_simulation_tree(client):
    response = client.get("/api/v1/public/simulation/tree")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert "bracket" in json_data["data"]
    assert "champion" in json_data["data"]

def test_get_simulation_timeline(client):
    response = client.get("/api/v1/public/simulation/timeline")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert isinstance(json_data["data"], list)

def test_get_h2h_fixtures(client):
    response = client.get("/api/v1/public/matches/h2h/fixtures")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert isinstance(json_data["data"], list)
    assert len(json_data["data"]) > 0

def test_get_h2h_predict_valid(client):
    response = client.get("/api/v1/public/matches/h2h/predict?home_team=USA&away_team=Paraguay")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert "home_probability" in json_data["data"]

def test_get_h2h_predict_invalid(client):
    response = client.get("/api/v1/public/matches/h2h/predict?home_team=USA&away_team=Argentina")
    assert response.status_code == 400

def test_post_reasoning_analyze(client):
    body = {
        "match_number": 0,
        "home_team": "USA",
        "away_team": "Paraguay"
    }
    response = client.post("/api/v1/public/reasoning/analyze", json=body)
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert "status" in json_data["data"]

def test_get_reasoning_status(client):
    response = client.get("/api/v1/public/reasoning/status?home_team=USA&away_team=Paraguay")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert "status" in json_data["data"]

def test_post_flush_repository(client):
    response = client.post("/api/v1/admin/cache/flush-repository")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert "message" in json_data["data"]

def test_post_flush_db_cache(client):
    response = client.post("/api/v1/admin/cache/flush-db-cache")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert "message" in json_data["data"]

def test_post_rebuild_sim(client):
    response = client.post("/api/v1/admin/simulation/rebuild")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert "message" in json_data["data"]
