from dataclasses import dataclass
from datetime import datetime
from typing import Optional

@dataclass
class WeatherLog:
    """
    Represents a weather data log.
    """
    latitude: float
    longitude: float
    timestamp: datetime
    temperature: float
    humidity: int
    wind_speed: float
    weather_code: int
    pressure: Optional[float] = None
    rain_probability: Optional[int] = None
