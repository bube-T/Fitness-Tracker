from datetime import date, datetime, timezone

from sqlalchemy import Column, Date, DateTime, ForeignKey, Index, Integer, String
from sqlalchemy.orm import relationship

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    meals = relationship("Meal", back_populates="owner", cascade="all, delete-orphan")
    workouts = relationship("Workout", back_populates="owner", cascade="all, delete-orphan")


class Meal(Base):
    __tablename__ = "meals"
    __table_args__ = (Index("ix_meals_user_date", "user_id", "log_date"),)

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    calories = Column(Integer, nullable=False)
    log_date = Column(Date, nullable=False, default=date.today)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    owner = relationship("User", back_populates="meals")


class Workout(Base):
    __tablename__ = "workouts"
    __table_args__ = (Index("ix_workouts_user_date", "user_id", "log_date"),)

    id = Column(Integer, primary_key=True, index=True)
    workout_type = Column(String, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    log_date = Column(Date, nullable=False, default=date.today)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    owner = relationship("User", back_populates="workouts")
