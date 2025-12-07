import json
from datetime import datetime

from src.domain.interfaces import QueuePublisher, WeatherApiClient


class CollectWeatherAndPublishUseCase:
    """
    Use case for collecting weather data and publishing it to a queue.
    """

    def __init__(
        self,
        weather_api_client: WeatherApiClient,
        queue_publisher: QueuePublisher,
        latitude: float,
        longitude: float,
        city_name: str,
    ):
        self.weather_api_client = weather_api_client
        self.queue_publisher = queue_publisher
        self.latitude = latitude
        self.longitude = longitude
        self.city_name = city_name

    def execute(self):
        """
        Executes the use case.
        """
        weather_log = self.weather_api_client.get_weather(
            self.latitude, self.longitude
        )

        message = {
            "latitude": weather_log.latitude,
            "longitude": weather_log.longitude,
            "timestamp": weather_log.timestamp.isoformat(),
            "temperature": weather_log.temperature,
            "humidity": weather_log.humidity,
            "wind_speed": weather_log.wind_speed,
            "weather_code": weather_log.weather_code,
            "pressure": weather_log.pressure,
            "rain_probability": weather_log.rain_probability,
            "city": self.city_name,
        }

        self.queue_publisher.publish(json.dumps(message))
