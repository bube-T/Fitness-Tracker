from datetime import date, timedelta


def test_streak_zero_for_new_user(client, auth_headers):
    data = client.get("/stats/weekly", headers=auth_headers).json()
    assert data["current_streak"] == 0


def test_streak_one_after_logging_today(client, auth_headers):
    today = date.today().isoformat()
    client.post("/meals", json={"name": "Oatmeal", "calories": 300, "log_date": today}, headers=auth_headers)
    data = client.get("/stats/weekly", headers=auth_headers).json()
    assert data["current_streak"] == 1


def test_streak_counts_consecutive_days(client, auth_headers):
    for i in range(4):
        day = (date.today() - timedelta(days=i)).isoformat()
        client.post("/meals", json={"name": "Meal", "calories": 300, "log_date": day}, headers=auth_headers)
    data = client.get("/stats/weekly", headers=auth_headers).json()
    assert data["current_streak"] == 4


def test_streak_breaks_on_gap(client, auth_headers):
    # Log today and 2 days ago but skip yesterday — streak should be 1 (today only)
    today = date.today().isoformat()
    two_days_ago = (date.today() - timedelta(days=2)).isoformat()
    client.post("/meals", json={"name": "Meal", "calories": 300, "log_date": today}, headers=auth_headers)
    client.post("/meals", json={"name": "Old meal", "calories": 300, "log_date": two_days_ago}, headers=auth_headers)
    data = client.get("/stats/weekly", headers=auth_headers).json()
    assert data["current_streak"] == 1


def test_streak_workout_counts(client, auth_headers):
    today = date.today().isoformat()
    client.post("/workouts", json={"workout_type": "Run", "duration_minutes": 30, "log_date": today}, headers=auth_headers)
    data = client.get("/stats/weekly", headers=auth_headers).json()
    assert data["current_streak"] == 1


def test_streak_isolation(client, auth_headers, auth_headers2):
    today = date.today().isoformat()
    client.post("/meals", json={"name": "Meal", "calories": 300, "log_date": today}, headers=auth_headers)
    data = client.get("/stats/weekly", headers=auth_headers2).json()
    assert data["current_streak"] == 0


def test_weekly_stats_empty(client, auth_headers):
    r = client.get("/stats/weekly", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert data["today_calories"] == 0
    assert data["today_workout_minutes"] == 0
    assert data["today_protein_g"] == 0
    assert data["today_carbs_g"] == 0
    assert data["today_fat_g"] == 0
    assert len(data["days"]) == 7


def test_macro_totals_today(client, auth_headers):
    today = date.today().isoformat()
    client.post("/meals", json={"name": "Chicken", "calories": 400,
                                "protein_g": 45, "carbs_g": 10, "fat_g": 12,
                                "log_date": today}, headers=auth_headers)
    client.post("/meals", json={"name": "Rice", "calories": 300,
                                "protein_g": 5, "carbs_g": 60,
                                "log_date": today}, headers=auth_headers)
    data = client.get("/stats/weekly", headers=auth_headers).json()
    assert data["today_protein_g"] == 50
    assert data["today_carbs_g"] == 70
    assert data["today_fat_g"] == 12


def test_macro_totals_ignore_null(client, auth_headers):
    today = date.today().isoformat()
    # One meal with macros, one without
    client.post("/meals", json={"name": "Chicken", "calories": 400,
                                "protein_g": 30, "log_date": today}, headers=auth_headers)
    client.post("/meals", json={"name": "Apple", "calories": 80,
                                "log_date": today}, headers=auth_headers)
    data = client.get("/stats/weekly", headers=auth_headers).json()
    assert data["today_protein_g"] == 30


def test_macro_totals_only_today(client, auth_headers):
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    today = date.today().isoformat()
    client.post("/meals", json={"name": "Yesterday meal", "calories": 300,
                                "protein_g": 999, "log_date": yesterday}, headers=auth_headers)
    client.post("/meals", json={"name": "Today meal", "calories": 400,
                                "protein_g": 20, "log_date": today}, headers=auth_headers)
    data = client.get("/stats/weekly", headers=auth_headers).json()
    assert data["today_protein_g"] == 20


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
