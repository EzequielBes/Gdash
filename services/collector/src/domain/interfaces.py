from abc import ABC, abstractmethod
from typing import Any

from src.domain.models import WeatherLog


class WeatherApiClient(ABC):
    """
    Abstract base class for a weather API client.
    """

    @abstractmethod
    def get_weather(self, latitude: float, longitude: float) -> WeatherLog:
        """
        Fetches weather data for a given location.
        """
        pass


class QueuePublisher(ABC):
    """
    Abstract base class for a queue publisher.
    """

    @abstractmethod
    def publish(self, message: Any):
        """
        Publishes a message to the queue.
        """
        pass
