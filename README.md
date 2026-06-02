# âš¡ APEX â€” Health & Fitness Tracker

A full-stack health tracking web app for logging meals, workouts, and body weight. Built as a portfolio project showcasing FastAPI, JWT authentication, PostgreSQL, and a custom dark glass-morphism design system.

**[Live Demo](https://APEX-health.netlify.app)** &nbsp;Â·&nbsp; **[API Docs](https://APEX-api.onrender.com/docs)**

---

## Features

- **Auth** â€” Register / login with JWT tokens and bcrypt password hashing
- **Meals** â€” Log calories + optional macros (protein, carbs, fat); full edit/delete history
- **Workouts** â€” Log workout type and duration with full history
- **Weight** â€” Track body weight with a 90-day trend chart
- **Dashboard** â€” Weekly bar chart, calorie progress bar, activity streak, macro breakdown
- **Rate limiting** â€” 5 registrations / 10 logins per minute per IP
- **Responsive** â€” Sidebar nav on desktop, bottom nav on mobile

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vanilla HTML / CSS / JavaScript |
| Charts | Chart.js |
| Backend | FastAPI (Python 3.12) |
| ORM | SQLAlchemy 2 |
| Auth | JWT Â· python-jose Â· bcrypt |
| Validation | Pydantic v2 |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Rate limiting | slowapi |
| Frontend deploy | Netlify |
| Backend deploy | Render |

## Local Setup

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS / Linux
pip install -r requirements.txt
uvicorn main:app --reload --port 3000
```

API: `http://127.0.0.1:3000` &nbsp;Â·&nbsp; Docs: `http://127.0.0.1:3000/docs`

### Frontend

Serve the `frontend/` folder with any static server. VS Code's **Live Server** extension is the easiest â€” right-click `frontend/index.html` â†’ *Open with Live Server* (serves on port 5500).

Or via Python:

```bash
cd frontend
python -m http.server 5500
```

Open `http://127.0.0.1:5500`.

> **Note:** Always serve via HTTP â€” opening HTML files directly as `file://` blocks API calls.

### Tests

```bash
cd backend
pytest -v
```

---

## Deployment

### Backend â†’ Render

1. Push repo to GitHub and connect it on [render.com](https://render.com)
2. Render reads `render.yaml` and auto-provisions:
   - Web service (`APEX-api`) with a generated `SECRET_KEY`
   - Free PostgreSQL database (`APEX-db`)
3. After the first deploy, set the `ALLOWED_ORIGINS` env var to your Netlify URL (e.g. `https://APEX-health.netlify.app`)

### Frontend â†’ Netlify

1. Connect repo on [netlify.com](https://netlify.com) â€” it reads `netlify.toml` automatically
2. Update `frontend/js/config.js`: replace `https://APEX-api.onrender.com` with your actual Render URL
3. Push â€” Netlify redeploys automatically

---

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Create account (5/min limit) |
| POST | `/auth/login` | Login (10/min limit) |
| GET | `/auth/me` | Current user |
| GET / POST | `/meals` | List / create meals |
| GET / PUT / DELETE | `/meals/{id}` | Get / update / delete meal |
| GET / POST | `/workouts` | List / create workouts |
| GET / PUT / DELETE | `/workouts/{id}` | Get / update / delete workout |
| GET / POST | `/weight` | List / log weight entries |
| GET | `/weight/history` | Last N days for trend chart |
| GET / PUT / DELETE | `/weight/{id}` | Get / update / delete entry |
| GET | `/stats/weekly` | 7-day aggregates + streak + macros |

## Project Structure

```
.
â”œâ”€â”€ backend/
â”‚   â”œâ”€â”€ routers/         # auth Â· meals Â· workouts Â· weight Â· stats
â”‚   â”œâ”€â”€ models.py        # SQLAlchemy models + composite indexes
â”‚   â”œâ”€â”€ schemas.py       # Pydantic request / response schemas
â”‚   â”œâ”€â”€ auth.py          # JWT helpers Â· password hashing
â”‚   â”œâ”€â”€ database.py      # SQLAlchemy engine + session
â”‚   â”œâ”€â”€ limiter.py       # slowapi rate limiter
â”‚   â”œâ”€â”€ main.py          # FastAPI app Â· CORS Â· middleware
â”‚   â””â”€â”€ tests/           # pytest suite (auth, meals, workouts, weight, stats)
â”œâ”€â”€ frontend/
â”‚   â”œâ”€â”€ css/styles.css   # APEX design system
â”‚   â”œâ”€â”€ js/              # api.js Â· nav.js Â· page scripts
â”‚   â””â”€â”€ *.html           # dashboard Â· meals Â· workouts Â· weight Â· profile
â”œâ”€â”€ render.yaml          # Render one-click deploy config
â””â”€â”€ netlify.toml         # Netlify deploy + security headers
```

