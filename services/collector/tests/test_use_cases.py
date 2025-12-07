import pytest
import json
from datetime import datetime, timezone
from unittest.mock import Mock
from src.application.use_cases import CollectWeatherAndPublishUseCase
from src.domain.models import WeatherLog
from src.domain.interfaces import WeatherApiClient, QueuePublisher

def test_collect_weather_and_publish_use_case_execute():
    mock_weather_api_client = Mock(spec=WeatherApiClient)
    mock_queue_publisher = Mock(spec=QueuePublisher)

    latitude = 10.0
    longitude = 20.0
    city_name = "TestCity"
    
    # Mock the weather_api_client.get_weather method
    mock_weather_log = WeatherLog(
        latitude=latitude,
        longitude=longitude,
        timestamp=datetime(2023, 10, 27, 10, 0, tzinfo=timezone.utc),
        temperature=15.0,
        humidity=70,
        wind_speed=5.0,
        weather_code=0,
        pressure=1012.0,
        rain_probability=20,
    )
    mock_weather_api_client.get_weather.return_value = mock_weather_log

    use_case = CollectWeatherAndPublishUseCase(
        weather_api_client=mock_weather_api_client,
        queue_publisher=mock_queue_publisher,
        latitude=latitude,
        longitude=longitude,
        city_name=city_name,
    )

    use_case.execute()

    # Assert that get_weather was called with the correct parameters
    mock_weather_api_client.get_weather.assert_called_once_with(latitude, longitude)

    # Assert that publish was called with the correct message
    expected_message = {
        "latitude": latitude,
        "longitude": longitude,
        "timestamp": mock_weather_log.timestamp.isoformat(),
        "temperature": mock_weather_log.temperature,
        "humidity": mock_weather_log.humidity,
        "wind_speed": mock_weather_log.wind_speed,
        "weather_code": mock_weather_log.weather_code,
        "pressure": mock_weather_log.pressure,
        "rain_probability": mock_weather_log.rain_probability,
        "city": city_name,
    }
    mock_queue_publisher.publish.assert_called_once_with(json.dumps(expected_message))
