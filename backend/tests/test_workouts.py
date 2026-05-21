from datetime import date


def test_create_workout(client, auth_headers):
    r = client.post(
        "/workouts",
        json={"workout_type": "Running", "duration_minutes": 30, "log_date": "2024-01-15"},
        headers=auth_headers,
    )
    assert r.status_code == 201
    data = r.json()
    assert data["workout_type"] == "Running"
    assert data["duration_minutes"] == 30
    assert data["log_date"] == "2024-01-15"


def test_create_workout_defaults_to_today(client, auth_headers):
    r = client.post("/workouts", json={"workout_type": "Yoga", "duration_minutes": 45}, headers=auth_headers)
    assert r.status_code == 201
    assert r.json()["log_date"] == date.today().isoformat()


def test_list_workouts(client, auth_headers):
    client.post("/workouts", json={"workout_type": "Running", "duration_minutes": 30}, headers=auth_headers)
    client.post("/workouts", json={"workout_type": "Yoga", "duration_minutes": 45}, headers=auth_headers)
    r = client.get("/workouts", headers=auth_headers)
    assert r.status_code == 200
    assert len(r.json()) == 2


def test_get_workout(client, auth_headers):
    wid = client.post("/workouts", json={"workout_type": "Running", "duration_minutes": 30}, headers=auth_headers).json()["id"]
    r = client.get(f"/workouts/{wid}", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["id"] == wid


def test_update_workout(client, auth_headers):
    wid = client.post("/workouts", json={"workout_type": "Running", "duration_minutes": 30}, headers=auth_headers).json()["id"]
    r = client.put(f"/workouts/{wid}", json={"duration_minutes": 60}, headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["duration_minutes"] == 60
    assert r.json()["workout_type"] == "Running"


def test_delete_workout(client, auth_headers):
    wid = client.post("/workouts", json={"workout_type": "Running", "duration_minutes": 30}, headers=auth_headers).json()["id"]
    assert client.delete(f"/workouts/{wid}", headers=auth_headers).status_code == 204
    assert client.get(f"/workouts/{wid}", headers=auth_headers).status_code == 404


def test_get_workout_not_found(client, auth_headers):
    r = client.get("/workouts/9999", headers=auth_headers)
    assert r.status_code == 404


def test_workout_isolation_get(client, auth_headers, auth_headers2):
    wid = client.post("/workouts", json={"workout_type": "Running", "duration_minutes": 30}, headers=auth_headers).json()["id"]
    assert client.get(f"/workouts/{wid}", headers=auth_headers2).status_code == 404


def test_workout_isolation_update(client, auth_headers, auth_headers2):
    wid = client.post("/workouts", json={"workout_type": "Running", "duration_minutes": 30}, headers=auth_headers).json()["id"]
    assert client.put(f"/workouts/{wid}", json={"duration_minutes": 45}, headers=auth_headers2).status_code == 404


def test_workout_isolation_delete(client, auth_headers, auth_headers2):
    wid = client.post("/workouts", json={"workout_type": "Running", "duration_minutes": 30}, headers=auth_headers).json()["id"]
    assert client.delete(f"/workouts/{wid}", headers=auth_headers2).status_code == 404


def test_workout_isolation_list(client, auth_headers, auth_headers2):
    client.post("/workouts", json={"workout_type": "Running", "duration_minutes": 30}, headers=auth_headers)
    assert client.get("/workouts", headers=auth_headers2).json() == []


def test_create_workout_unauthenticated(client):
    r = client.post("/workouts", json={"workout_type": "Running", "duration_minutes": 30})
    assert r.status_code == 401


def test_create_workout_zero_duration(client, auth_headers):
    r = client.post("/workouts", json={"workout_type": "Running", "duration_minutes": 0}, headers=auth_headers)
    assert r.status_code == 422


def test_create_workout_empty_type(client, auth_headers):
    r = client.post("/workouts", json={"workout_type": "", "duration_minutes": 30}, headers=auth_headers)
    assert r.status_code == 422
