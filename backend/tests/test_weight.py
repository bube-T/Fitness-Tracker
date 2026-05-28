from datetime import date, timedelta


def test_create_weight(client, auth_headers):
    r = client.post("/weight", json={"weight_kg": 72.5, "log_date": "2024-01-15"}, headers=auth_headers)
    assert r.status_code == 201
    data = r.json()
    assert data["weight_kg"] == 72.5
    assert data["log_date"] == "2024-01-15"


def test_create_weight_defaults_to_today(client, auth_headers):
    r = client.post("/weight", json={"weight_kg": 70.0}, headers=auth_headers)
    assert r.status_code == 201
    assert r.json()["log_date"] == date.today().isoformat()


def test_list_weight(client, auth_headers):
    client.post("/weight", json={"weight_kg": 72.0}, headers=auth_headers)
    client.post("/weight", json={"weight_kg": 71.5}, headers=auth_headers)
    r = client.get("/weight", headers=auth_headers)
    assert r.status_code == 200
    assert len(r.json()) == 2


def test_update_weight(client, auth_headers):
    wid = client.post("/weight", json={"weight_kg": 72.0}, headers=auth_headers).json()["id"]
    r = client.put(f"/weight/{wid}", json={"weight_kg": 71.5}, headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["weight_kg"] == 71.5


def test_delete_weight(client, auth_headers):
    wid = client.post("/weight", json={"weight_kg": 72.0}, headers=auth_headers).json()["id"]
    assert client.delete(f"/weight/{wid}", headers=auth_headers).status_code == 204
    assert client.get(f"/weight/{wid}", headers=auth_headers).status_code == 404


def test_weight_not_found(client, auth_headers):
    assert client.get("/weight/9999", headers=auth_headers).status_code == 404


def test_weight_isolation(client, auth_headers, auth_headers2):
    wid = client.post("/weight", json={"weight_kg": 72.0}, headers=auth_headers).json()["id"]
    assert client.delete(f"/weight/{wid}", headers=auth_headers2).status_code == 404


def test_weight_isolation_list(client, auth_headers, auth_headers2):
    client.post("/weight", json={"weight_kg": 72.0}, headers=auth_headers)
    assert client.get("/weight", headers=auth_headers2).json() == []


def test_weight_history(client, auth_headers):
    for i in range(3):
        day = (date.today() - timedelta(days=i * 10)).isoformat()
        client.post("/weight", json={"weight_kg": 72.0 - i * 0.5, "log_date": day}, headers=auth_headers)
    r = client.get("/weight/history", headers=auth_headers)
    assert r.status_code == 200
    entries = r.json()
    assert len(entries) == 3
    # history returns ascending by date
    assert entries[0]["log_date"] <= entries[-1]["log_date"]


def test_weight_history_excludes_old_entries(client, auth_headers):
    old = (date.today() - timedelta(days=200)).isoformat()
    recent = date.today().isoformat()
    client.post("/weight", json={"weight_kg": 80.0, "log_date": old}, headers=auth_headers)
    client.post("/weight", json={"weight_kg": 72.0, "log_date": recent}, headers=auth_headers)
    entries = client.get("/weight/history?days=90", headers=auth_headers).json()
    assert len(entries) == 1
    assert entries[0]["weight_kg"] == 72.0


def test_weight_unauthenticated(client):
    assert client.post("/weight", json={"weight_kg": 72.0}).status_code == 401


def test_create_weight_invalid(client, auth_headers):
    assert client.post("/weight", json={"weight_kg": -1}, headers=auth_headers).status_code == 422


def test_latest_weight_in_stats(client, auth_headers):
    client.post("/weight", json={"weight_kg": 72.0, "log_date": "2024-01-10"}, headers=auth_headers)
    client.post("/weight", json={"weight_kg": 71.5, "log_date": "2024-01-15"}, headers=auth_headers)
    data = client.get("/stats/weekly", headers=auth_headers).json()
    assert data["latest_weight_kg"] == 71.5


def test_latest_weight_none_for_new_user(client, auth_headers):
    data = client.get("/stats/weekly", headers=auth_headers).json()
    assert data["latest_weight_kg"] is None
