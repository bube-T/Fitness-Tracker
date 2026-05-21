def test_register(client):
    r = client.post("/auth/register", json={"email": "a@b.com", "password": "secret123"})
    assert r.status_code == 201
    data = r.json()
    assert data["email"] == "a@b.com"
    assert "id" in data
    assert "hashed_password" not in data


def test_register_duplicate_email(client):
    payload = {"email": "a@b.com", "password": "secret123"}
    client.post("/auth/register", json=payload)
    r = client.post("/auth/register", json=payload)
    assert r.status_code == 400


def test_register_short_password(client):
    r = client.post("/auth/register", json={"email": "a@b.com", "password": "abc"})
    assert r.status_code == 422


def test_register_invalid_email(client):
    r = client.post("/auth/register", json={"email": "not-an-email", "password": "secret123"})
    assert r.status_code == 422


def test_login_success(client):
    client.post("/auth/register", json={"email": "a@b.com", "password": "secret123"})
    r = client.post("/auth/login", data={"username": "a@b.com", "password": "secret123"})
    assert r.status_code == 200
    assert "access_token" in r.json()
    assert r.json()["token_type"] == "bearer"


def test_login_wrong_password(client):
    client.post("/auth/register", json={"email": "a@b.com", "password": "secret123"})
    r = client.post("/auth/login", data={"username": "a@b.com", "password": "wrongpass"})
    assert r.status_code == 401


def test_login_unknown_email(client):
    r = client.post("/auth/login", data={"username": "ghost@b.com", "password": "secret123"})
    assert r.status_code == 401


def test_me(client, auth_headers):
    r = client.get("/auth/me", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["email"] == "user@example.com"


def test_me_unauthenticated(client):
    r = client.get("/auth/me")
    assert r.status_code == 401


def test_me_invalid_token(client):
    r = client.get("/auth/me", headers={"Authorization": "Bearer invalid.token.here"})
    assert r.status_code == 401
