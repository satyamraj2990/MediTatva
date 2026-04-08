from pydantic import BaseModel, Field


class ChatQuery(BaseModel):
    message: str = Field(..., min_length=1, max_length=500)


class MoodInsights(BaseModel):
    mood: str
    confidence: float
    supportive_tip: str


class ChatResponse(BaseModel):
    reply: str
    insights: MoodInsights


class DistanceRequest(BaseModel):
    from_lat: float
    from_lng: float
    to_lat: float
    to_lng: float


class DistanceResponse(BaseModel):
    distance_km: float
    eta_minutes: int
