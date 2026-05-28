from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import User, WeightEntry
from schemas import WeightCreate, WeightResponse, WeightUpdate

router = APIRouter(prefix="/weight", tags=["weight"])


@router.get("/history", response_model=list[WeightResponse])
def weight_history(
    days: int = Query(90, ge=7, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    since = date.today() - timedelta(days=days)
    return (
        db.query(WeightEntry)
        .filter(WeightEntry.user_id == current_user.id, WeightEntry.log_date >= since)
        .order_by(WeightEntry.log_date.asc(), WeightEntry.id.asc())
        .all()
    )


@router.get("", response_model=list[WeightResponse])
def list_weight(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(WeightEntry)
        .filter(WeightEntry.user_id == current_user.id)
        .order_by(WeightEntry.log_date.desc(), WeightEntry.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.post("", response_model=WeightResponse, status_code=status.HTTP_201_CREATED)
def create_weight(
    entry_in: WeightCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = WeightEntry(
        weight_kg=entry_in.weight_kg,
        log_date=entry_in.log_date or date.today(),
        user_id=current_user.id,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/{entry_id}", response_model=WeightResponse)
def get_weight(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _get_user_entry(db, entry_id, current_user.id)


@router.put("/{entry_id}", response_model=WeightResponse)
def update_weight(
    entry_id: int,
    entry_in: WeightUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = _get_user_entry(db, entry_id, current_user.id)
    updates = entry_in.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(entry, field, value)
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_weight(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = _get_user_entry(db, entry_id, current_user.id)
    db.delete(entry)
    db.commit()


def _get_user_entry(db: Session, entry_id: int, user_id: int) -> WeightEntry:
    entry = (
        db.query(WeightEntry)
        .filter(WeightEntry.id == entry_id, WeightEntry.user_id == user_id)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Weight entry not found")
    return entry
