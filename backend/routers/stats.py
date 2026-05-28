from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import Meal, User, WeightEntry, Workout
from schemas import DailyStats, WeeklyStatsResponse

router = APIRouter(prefix="/stats", tags=["stats"])


def _compute_streak(db: Session, user_id: int) -> int:
    meal_dates = {
        row[0]
        for row in db.query(Meal.log_date)
        .filter(Meal.user_id == user_id)
        .distinct()
        .all()
    }
    workout_dates = {
        row[0]
        for row in db.query(Workout.log_date)
        .filter(Workout.user_id == user_id)
        .distinct()
        .all()
    }
    active_dates = meal_dates | workout_dates

    # Start from today; fall back to yesterday so streak doesn't reset at
    # midnight before the user has had a chance to log.
    today = date.today()
    start = today if today in active_dates else today - timedelta(days=1)

    streak = 0
    day = start
    while day in active_dates:
        streak += 1
        day -= timedelta(days=1)

    return streak


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

    # Today's macro totals (NULL-safe: SUM ignores NULL values)
    macro_row = (
        db.query(
            func.coalesce(func.sum(Meal.protein_g), 0),
            func.coalesce(func.sum(Meal.carbs_g), 0),
            func.coalesce(func.sum(Meal.fat_g), 0),
        )
        .filter(Meal.user_id == user_id, Meal.log_date == today)
        .first()
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

    latest_weight = (
        db.query(WeightEntry.weight_kg)
        .filter(WeightEntry.user_id == user_id)
        .order_by(WeightEntry.log_date.desc(), WeightEntry.id.desc())
        .first()
    )

    return WeeklyStatsResponse(
        days=days,
        today_calories=calories_by_date.get(today, 0),
        today_workout_minutes=minutes_by_date.get(today, 0),
        today_protein_g=int(macro_row[0]) if macro_row else 0,
        today_carbs_g=int(macro_row[1]) if macro_row else 0,
        today_fat_g=int(macro_row[2]) if macro_row else 0,
        current_streak=_compute_streak(db, user_id),
        latest_weight_kg=float(latest_weight[0]) if latest_weight else None,
    )
