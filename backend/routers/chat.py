import os
from datetime import date

import anthropic
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import Meal, User, WeightEntry, Workout

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []


class ChatResponse(BaseModel):
    reply: str


def _build_context(db: Session, user_id: int) -> str:
    today = date.today()

    meals    = db.query(Meal).filter(Meal.user_id == user_id, Meal.log_date == today).all()
    workouts = db.query(Workout).filter(Workout.user_id == user_id, Workout.log_date == today).all()
    weight   = (
        db.query(WeightEntry)
        .filter(WeightEntry.user_id == user_id)
        .order_by(WeightEntry.log_date.desc())
        .first()
    )

    cal     = sum(m.calories for m in meals)
    protein = sum(m.protein_g or 0 for m in meals)
    carbs   = sum(m.carbs_g or 0 for m in meals)
    fat     = sum(m.fat_g or 0 for m in meals)
    mins    = sum(w.duration_minutes for w in workouts)

    lines = [f"Today is {today.strftime('%B %d, %Y')}."]
    lines.append(f"Calories logged today: {cal} kcal across {len(meals)} meal(s).")
    if protein or carbs or fat:
        lines.append(f"Macros today — Protein: {protein}g, Carbs: {carbs}g, Fat: {fat}g.")
    lines.append(f"Workout time today: {mins} min." if mins else "No workouts logged today.")
    if weight:
        lines.append(f"Latest weight: {weight.weight_kg} kg (logged {weight.log_date}).")

    return "\n".join(lines)


SYSTEM_PROMPT = """You are APEX Assistant, a personal health and fitness AI inside the APEX health tracker. Help users with nutrition, workouts, and wellness.

{context}

Rules:
- Be concise (2-4 sentences max per reply unless the user asks for detail).
- Reference the user's actual data when relevant.
- Be encouraging but honest.
- Do not make medical diagnoses."""


@router.post("", response_model=ChatResponse)
def chat(
    req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI assistant is not configured.",
        )

    context  = _build_context(db, current_user.id)
    messages = [{"role": m.role, "content": m.content} for m in req.history]
    messages.append({"role": "user", "content": req.message})

    client   = anthropic.Anthropic(api_key=api_key)
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=512,
        system=SYSTEM_PROMPT.format(context=context),
        messages=messages,
    )

    return ChatResponse(reply=response.content[0].text)
