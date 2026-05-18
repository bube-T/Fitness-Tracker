from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import Meal, User, Workout
from schemas import DailyStats, WeeklyStatsResponse

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/weekly", response_model=WeeklyStatsResponse)
def weekly_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = date.today()
    start = today - timedelta(days=6)
    user_id = current_user.id

    meal_rows = (
        db.query(Meal.log_date, func.coalesce(func.sum(Meal.calories), 0))
        .filter(Meal.user_id == user_id, Meal.log_date >= start, Meal.log_date <= today)
        .group_by(Meal.log_date)
        .all()
    )
    workout_rows = (
        db.query(Workout.log_date, func.coalesce(func.sum(Workout.duration_minutes), 0))
        .filter(
            Workout.user_id == user_id,
            Workout.log_date >= start,
            Workout.log_date <= today,
        )
        .group_by(Workout.log_date)
        .all()
    )

    calories_by_date = {row[0]: int(row[1]) for row in meal_rows}
    minutes_by_date = {row[0]: int(row[1]) for row in workout_rows}

    days: list[DailyStats] = []
    for offset in range(7):
        day = start + timedelta(days=offset)
        days.append(
            DailyStats(
                date=day,
                total_calories=calories_by_date.get(day, 0),
                total_workout_minutes=minutes_by_date.get(day, 0),
            )
        )

    return WeeklyStatsResponse(
        days=days,
        today_calories=calories_by_date.get(today, 0),
        today_workout_minutes=minutes_by_date.get(today, 0),
    )
