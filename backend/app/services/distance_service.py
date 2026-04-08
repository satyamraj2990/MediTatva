from math import atan2, cos, radians, sin, sqrt


def haversine_distance_km(from_lat: float, from_lng: float, to_lat: float, to_lng: float) -> float:
    earth_radius_km = 6371.0

    d_lat = radians(to_lat - from_lat)
    d_lng = radians(to_lng - from_lng)

    start_lat = radians(from_lat)
    end_lat = radians(to_lat)

    a = sin(d_lat / 2) ** 2 + cos(start_lat) * cos(end_lat) * sin(d_lng / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return round(earth_radius_km * c, 2)


def estimate_eta_minutes(distance_km: float, speed_kmph: float = 30.0) -> int:
    hours = distance_km / max(speed_kmph, 1.0)
    return max(1, round(hours * 60))
