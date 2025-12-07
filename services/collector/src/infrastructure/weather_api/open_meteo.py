from datetime import datetime

import requests

from src.domain.interfaces import WeatherApiClient
from src.domain.models import WeatherLog


class OpenMeteoClient(WeatherApiClient):
    """
    A weather API client for Open-Meteo.
    """

    def __init__(self, base_url="https://api.open-meteo.com/v1/forecast"):
        self.base_url = base_url

    def get_weather(self, latitude: float, longitude: float) -> WeatherLog:
        """
        Fetches weather data from the Open-Meteo API.
        """
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "current": "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,pressure_msl,precipitation_probability",
            "forecast_days": 1, # Ensure we get current day forecast
        }
        response = requests.get(self.base_url, params=params)
        response.raise_for_status()
        data = response.json()

        current_weather = data["current"]
        return WeatherLog(
            latitude=latitude,
            longitude=longitude,
            timestamp=datetime.fromisoformat(current_weather["time"]),
            temperature=current_weather["temperature_2m"],
            humidity=current_weather["relative_humidity_2m"],
            wind_speed=current_weather["wind_speed_10m"],
            weather_code=current_weather["weather_code"],
            pressure=current_weather["pressure_msl"],
            rain_probability=current_weather["precipitation_probability"],
        )
