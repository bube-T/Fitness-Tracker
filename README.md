# Health Tracker — Meal & Workout Tracker

Full-stack portfolio project: log meals and workouts, view weekly stats, and manage your data with secure login.

## Tech stack

- **Backend:** FastAPI, SQLAlchemy, SQLite (local) / PostgreSQL (deploy)
- **Auth:** JWT (Bearer token)
- **Frontend:** HTML, CSS, vanilla JavaScript, Chart.js
- **Deploy:** Render (API + DB), Vercel or Netlify (frontend)

## Features

- Register, log in, log out
- CRUD for meals (name, calories, date)
- CRUD for workouts (type, duration, date)
- Dashboard with today’s totals and a 7-day chart

## Project structure

```
backend/          # FastAPI API
frontend/         # Static web UI
render.yaml       # Optional Render deploy blueprint
```

## Run locally (Windows)

### 1. Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload
```

API: http://127.0.0.1:8000  
Interactive docs: http://127.0.0.1:8000/docs

### 2. Frontend

Serve the `frontend` folder with a local static server (required for API calls — do not open HTML files directly as `file://`).

**VS Code:** Install “Live Server”, open `frontend/login.html`, click “Go Live” (usually port 5500).

**Python:**

```powershell
cd frontend
python -m http.server 8080
```

Open http://localhost:8080/login.html

`frontend/js/config.js` defaults to `http://127.0.0.1:8000` for the API.

## Deploy

### Backend (Render)

1. Push this repo to GitHub.
2. On [Render](https://render.com), create a **Web Service** from the repo.
3. Set **Root Directory** to `backend`.
4. Build: `pip install -r requirements.txt`
5. Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add env vars: `SECRET_KEY` (random string), `DATABASE_URL` (from Render PostgreSQL), `ALLOWED_ORIGINS` (your frontend URL).

Or use the included `render.yaml` blueprint.

### Frontend (Vercel — recommended)

1. Push the repo to GitHub and import it on [Vercel](https://vercel.com).
2. In project **Settings → General → Root Directory**, set **`frontend`** (this folder contains `login.html`).
3. Framework Preset: **Other** (no build command needed).
4. Before deploy, set your API URL in [`frontend/js/config.js`](frontend/js/config.js):

   ```js
   window.API_BASE_URL = "https://YOUR-RENDER-API.onrender.com";
   ```

5. Deploy. Copy your Vercel URL (e.g. `https://health-tracker.vercel.app`).
6. On Render, set backend env var `ALLOWED_ORIGINS` to that URL (comma-separated if you have multiple).

### Frontend (Netlify)

Same idea: publish directory `frontend`, update `config.js`, add your site URL to `ALLOWED_ORIGINS` on the backend. See [`netlify.toml`](netlify.toml).

## API overview

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Login (form: username=email, password) |
| GET | `/auth/me` | Current user (Bearer token) |
| GET/POST | `/meals` | List / create meals |
| PUT/DELETE | `/meals/{id}` | Update / delete meal |
| GET/POST | `/workouts` | List / create workouts |
| PUT/DELETE | `/workouts/{id}` | Update / delete workout |
| GET | `/stats/weekly` | Last 7 days aggregates |

