from fastapi import APIRouter

from app.models.schemas import DistanceRequest, DistanceResponse
from app.services.distance_service import estimate_eta_minutes, haversine_distance_km

router = APIRouter(prefix="/api/distance", tags=["distance"])


@router.post("/estimate", response_model=DistanceResponse)
def estimate_distance(payload: DistanceRequest) -> DistanceResponse:
    distance_km = haversine_distance_km(
        payload.from_lat,
        payload.from_lng,
        payload.to_lat,
        payload.to_lng,
    )
    eta_minutes = estimate_eta_minutes(distance_km)
    return DistanceResponse(distance_km=distance_km, eta_minutes=eta_minutes)
