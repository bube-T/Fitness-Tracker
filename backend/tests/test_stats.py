from datetime import date, timedelta


def test_weekly_stats_empty(client, auth_headers):
    r = client.get("/stats/weekly", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert data["today_calories"] == 0
    assert data["today_workout_minutes"] == 0
    assert len(data["days"]) == 7


def test_weekly_stats_today(client, auth_headers):
    today = date.today().isoformat()
    client.post("/meals", json={"name": "Oatmeal", "calories": 300, "log_date": today}, headers=auth_headers)
    client.post("/meals", json={"name": "Lunch", "calories": 500, "log_date": today}, headers=auth_headers)
    client.post("/workouts", json={"workout_type": "Run", "duration_minutes": 30, "log_date": today}, headers=auth_headers)

    r = client.get("/stats/weekly", headers=auth_headers)
    data = r.json()
    assert data["today_calories"] == 800
    assert data["today_workout_minutes"] == 30


def test_weekly_stats_covers_7_days(client, auth_headers):
    # log on day 6 days ago (should be in range) and 8 days ago (outside range)
    in_range = (date.today() - timedelta(days=6)).isoformat()
    out_of_range = (date.today() - timedelta(days=8)).isoformat()
    client.post("/meals", json={"name": "Old meal", "calories": 400, "log_date": in_range}, headers=auth_headers)
    client.post("/meals", json={"name": "Too old", "calories": 999, "log_date": out_of_range}, headers=auth_headers)

    data = client.get("/stats/weekly", headers=auth_headers).json()
    total = sum(d["total_calories"] for d in data["days"])
    assert total == 400


def test_weekly_stats_isolation(client, auth_headers, auth_headers2):
    today = date.today().isoformat()
    client.post("/meals", json={"name": "Oatmeal", "calories": 300, "log_date": today}, headers=auth_headers)

    data = client.get("/stats/weekly", headers=auth_headers2).json()
    assert data["today_calories"] == 0


def test_weekly_stats_unauthenticated(client):
    r = client.get("/stats/weekly")
    assert r.status_code == 401
