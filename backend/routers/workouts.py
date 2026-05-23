from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import User, Workout
from schemas import WorkoutCreate, WorkoutResponse, WorkoutUpdate

router = APIRouter(prefix="/workouts", tags=["workouts"])


@router.get("", response_model=list[WorkoutResponse])
def list_workouts(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Workout)
        .filter(Workout.user_id == current_user.id)
        .order_by(Workout.log_date.desc(), Workout.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.post("", response_model=WorkoutResponse, status_code=status.HTTP_201_CREATED)
def create_workout(
    workout_in: WorkoutCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workout = Workout(
        workout_type=workout_in.workout_type,
        duration_minutes=workout_in.duration_minutes,
        log_date=workout_in.log_date or date.today(),
        user_id=current_user.id,
    )
    db.add(workout)
    db.commit()
    db.refresh(workout)
    return workout


@router.get("/{workout_id}", response_model=WorkoutResponse)
def get_workout(
    workout_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _get_user_workout(db, workout_id, current_user.id)


@router.put("/{workout_id}", response_model=WorkoutResponse)
def update_workout(
    workout_id: int,
    workout_in: WorkoutUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workout = _get_user_workout(db, workout_id, current_user.id)
    updates = workout_in.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(workout, field, value)
    db.commit()
    db.refresh(workout)
    return workout


@router.delete("/{workout_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workout(
    workout_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workout = _get_user_workout(db, workout_id, current_user.id)
    db.delete(workout)
    db.commit()


def _get_user_workout(db: Session, workout_id: int, user_id: int) -> Workout:
    workout = (
        db.query(Workout)
        .filter(Workout.id == workout_id, Workout.user_id == user_id)
        .first()
    )
    if not workout:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workout not found")
    return workout
