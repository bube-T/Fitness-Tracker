from datetime import date


def test_create_meal(client, auth_headers):
    r = client.post(
        "/meals",
        json={"name": "Oatmeal", "calories": 300, "log_date": "2024-01-15"},
        headers=auth_headers,
    )
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == "Oatmeal"
    assert data["calories"] == 300
    assert data["log_date"] == "2024-01-15"


def test_create_meal_defaults_to_today(client, auth_headers):
    r = client.post("/meals", json={"name": "Oatmeal", "calories": 300}, headers=auth_headers)
    assert r.status_code == 201
    assert r.json()["log_date"] == date.today().isoformat()


def test_list_meals(client, auth_headers):
    client.post("/meals", json={"name": "Oatmeal", "calories": 300}, headers=auth_headers)
    client.post("/meals", json={"name": "Salad", "calories": 200}, headers=auth_headers)
    r = client.get("/meals", headers=auth_headers)
    assert r.status_code == 200
    assert len(r.json()) == 2


def test_get_meal(client, auth_headers):
    meal_id = client.post("/meals", json={"name": "Oatmeal", "calories": 300}, headers=auth_headers).json()["id"]
    r = client.get(f"/meals/{meal_id}", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["id"] == meal_id


def test_update_meal(client, auth_headers):
    meal_id = client.post("/meals", json={"name": "Oatmeal", "calories": 300}, headers=auth_headers).json()["id"]
    r = client.put(f"/meals/{meal_id}", json={"calories": 350}, headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["calories"] == 350
    assert r.json()["name"] == "Oatmeal"


def test_delete_meal(client, auth_headers):
    meal_id = client.post("/meals", json={"name": "Oatmeal", "calories": 300}, headers=auth_headers).json()["id"]
    assert client.delete(f"/meals/{meal_id}", headers=auth_headers).status_code == 204
    assert client.get(f"/meals/{meal_id}", headers=auth_headers).status_code == 404


def test_get_meal_not_found(client, auth_headers):
    r = client.get("/meals/9999", headers=auth_headers)
    assert r.status_code == 404


def test_meal_isolation_get(client, auth_headers, auth_headers2):
    meal_id = client.post("/meals", json={"name": "Oatmeal", "calories": 300}, headers=auth_headers).json()["id"]
    r = client.get(f"/meals/{meal_id}", headers=auth_headers2)
    assert r.status_code == 404


def test_meal_isolation_update(client, auth_headers, auth_headers2):
    meal_id = client.post("/meals", json={"name": "Oatmeal", "calories": 300}, headers=auth_headers).json()["id"]
    r = client.put(f"/meals/{meal_id}", json={"calories": 999}, headers=auth_headers2)
    assert r.status_code == 404


def test_meal_isolation_delete(client, auth_headers, auth_headers2):
    meal_id = client.post("/meals", json={"name": "Oatmeal", "calories": 300}, headers=auth_headers).json()["id"]
    r = client.delete(f"/meals/{meal_id}", headers=auth_headers2)
    assert r.status_code == 404


def test_meal_isolation_list(client, auth_headers, auth_headers2):
    client.post("/meals", json={"name": "Oatmeal", "calories": 300}, headers=auth_headers)
    r = client.get("/meals", headers=auth_headers2)
    assert r.json() == []


def test_create_meal_unauthenticated(client):
    r = client.post("/meals", json={"name": "Oatmeal", "calories": 300})
    assert r.status_code == 401


def test_create_meal_negative_calories(client, auth_headers):
    r = client.post("/meals", json={"name": "X", "calories": -1}, headers=auth_headers)
    assert r.status_code == 422


def test_create_meal_empty_name(client, auth_headers):
    r = client.post("/meals", json={"name": "", "calories": 300}, headers=auth_headers)
    assert r.status_code == 422
