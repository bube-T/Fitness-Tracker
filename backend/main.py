import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from routers import auth, meals, stats, workouts

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Health Tracker API",
    description="Meal & Workout Tracker — portfolio full-stack project",
    version="1.0.0",
)

default_origins = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://127.0.0.1:8080",
    "http://localhost:8080",
    "http://127.0.0.1:3000",
    "http://localhost:3000",
]
extra = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins = default_origins + [o.strip() for o in extra.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(meals.router)
app.include_router(workouts.router)
app.include_router(stats.router)


@app.get("/")
def root():
    return {"message": "Health Tracker API", "docs": "/docs"}


@app.get("/health")
def health_check():
    return {"status": "ok"}
