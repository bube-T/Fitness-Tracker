from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import Meal, User
from schemas import MealCreate, MealResponse, MealUpdate

router = APIRouter(prefix="/meals", tags=["meals"])


@router.get("", response_model=list[MealResponse])
def list_meals(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Meal)
        .filter(Meal.user_id == current_user.id)
        .order_by(Meal.log_date.desc(), Meal.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.post("", response_model=MealResponse, status_code=status.HTTP_201_CREATED)
def create_meal(
    meal_in: MealCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meal = Meal(
        name=meal_in.name,
        calories=meal_in.calories,
        log_date=meal_in.log_date or date.today(),
        user_id=current_user.id,
    )
    db.add(meal)
    db.commit()
    db.refresh(meal)
    return meal


@router.get("/{meal_id}", response_model=MealResponse)
def get_meal(
    meal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meal = _get_user_meal(db, meal_id, current_user.id)
    return meal


@router.put("/{meal_id}", response_model=MealResponse)
def update_meal(
    meal_id: int,
    meal_in: MealUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meal = _get_user_meal(db, meal_id, current_user.id)
    updates = meal_in.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(meal, field, value)
    db.commit()
    db.refresh(meal)
    return meal


@router.delete("/{meal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meal(
    meal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meal = _get_user_meal(db, meal_id, current_user.id)
    db.delete(meal)
    db.commit()


def _get_user_meal(db: Session, meal_id: int, user_id: int) -> Meal:
    meal = db.query(Meal).filter(Meal.id == meal_id, Meal.user_id == user_id).first()
    if not meal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meal not found")
    return meal
