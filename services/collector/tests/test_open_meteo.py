import pytest
import requests_mock
from datetime import datetime, timezone
from src.infrastructure.weather_api.open_meteo import OpenMeteoClient
from src.domain.models import WeatherLog

def test_get_weather_success():
    client = OpenMeteoClient()
    latitude = 52.52
    longitude = 13.41

    mock_response = {
        "latitude": latitude,
        "longitude": longitude,
        "generationtime_ms": 0.1,
        "utc_offset_seconds": 0,
        "timezone": "Europe/Berlin",
        "timezone_abbreviation": "CEST",
        "elevation": 38.0,
        "current_units": {
            "time": "iso8601",
            "interval": "seconds",
            "temperature_2m": "°C",
            "relative_humidity_2m": "%",
            "wind_speed_10m": "km/h",
            "weather_code": "wmo code",
            "pressure_msl": "hPa",
            "precipitation_probability": "%",
        },
        "current": {
            "time": "2023-10-27T10:00Z",
            "interval": 900,
            "temperature_2m": 10.5,
            "relative_humidity_2m": 85,
            "wind_speed_10m": 15.2,
            "weather_code": 3,
            "pressure_msl": 1012.5,
            "precipitation_probability": 30,
        },
    }

    with requests_mock.Mocker() as m:
        m.get(
            "https://api.open-meteo.com/v1/forecast",
            json=mock_response,
            status_code=200,
        )

        weather_log = client.get_weather(latitude, longitude)

        assert isinstance(weather_log, WeatherLog)
        assert weather_log.latitude == latitude
        assert weather_log.longitude == longitude
        assert weather_log.timestamp == datetime(2023, 10, 27, 10, 0, tzinfo=timezone.utc)
        assert weather_log.temperature == 10.5
        assert weather_log.humidity == 85
        assert weather_log.wind_speed == 15.2
        assert weather_log.weather_code == 3
        assert weather_log.pressure == 1012.5
        assert weather_log.rain_probability == 30

def test_get_weather_api_error():
    client = OpenMeteoClient()
    latitude = 52.52
    longitude = 13.41

    with requests_mock.Mocker() as m:
        m.get(
            "https://api.open-meteo.com/v1/forecast",
            status_code=500,
        )

        with pytest.raises(requests_mock.exceptions.NoMockAddress):
            client.get_weather(latitude, longitude)
