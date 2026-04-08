from fastapi import APIRouter

from app.models.schemas import ChatQuery, ChatResponse
from app.services.chatbot_service import detect_mood, generate_reply

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/query", response_model=ChatResponse)
def chat_query(payload: ChatQuery) -> ChatResponse:
    mood = detect_mood(payload.message)
    reply = generate_reply(payload.message, mood)
    return ChatResponse(reply=reply, insights=mood)
