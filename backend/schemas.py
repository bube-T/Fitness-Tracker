from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    created_at: datetime | None = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class MealCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    calories: int = Field(ge=0, le=10000)
    protein_g: int | None = Field(default=None, ge=0, le=500)
    carbs_g: int | None = Field(default=None, ge=0, le=1000)
    fat_g: int | None = Field(default=None, ge=0, le=500)
    log_date: date | None = None


class MealUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    calories: int | None = Field(default=None, ge=0, le=10000)
    protein_g: int | None = Field(default=None, ge=0, le=500)
    carbs_g: int | None = Field(default=None, ge=0, le=1000)
    fat_g: int | None = Field(default=None, ge=0, le=500)
    log_date: date | None = None


class MealResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    calories: int
    protein_g: int | None = None
    carbs_g: int | None = None
    fat_g: int | None = None
    log_date: date
    user_id: int


class WorkoutCreate(BaseModel):
    workout_type: str = Field(min_length=1, max_length=100)
    duration_minutes: int = Field(ge=1, le=600)
    log_date: date | None = None


class WorkoutUpdate(BaseModel):
    workout_type: str | None = Field(default=None, min_length=1, max_length=100)
    duration_minutes: int | None = Field(default=None, ge=1, le=600)
    log_date: date | None = None


class WorkoutResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    workout_type: str
    duration_minutes: int
    log_date: date
    user_id: int


class DailyStats(BaseModel):
    date: date
    total_calories: int
    total_workout_minutes: int


class WeightCreate(BaseModel):
    weight_kg: float = Field(gt=0, le=500)
    log_date: date | None = None


class WeightUpdate(BaseModel):
    weight_kg: float | None = Field(default=None, gt=0, le=500)
    log_date: date | None = None


class WeightResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    weight_kg: float
    log_date: date
    user_id: int


class WeeklyStatsResponse(BaseModel):
    days: list[DailyStats]
    today_calories: int
    today_workout_minutes: int
    today_protein_g: int
    today_carbs_g: int
    today_fat_g: int
    current_streak: int
    latest_weight_kg: float | None = None
