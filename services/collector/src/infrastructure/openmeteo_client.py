import requests
import logging
from datetime import datetime
import sys
sys.path.insert(0, '/app')
from config import OPENMETEO_API_URL

logger = logging.getLogger(__name__)

class OpenMeteoClient:
    def __init__(self):
        self.base_url = OPENMETEO_API_URL
        self.session = requests.Session()
    
    def get_weather(self, latitude: float, longitude: float, city_name: str):
        """Busca dados climáticos do Open-Meteo"""
        try:
            params = {
                'latitude': latitude,
                'longitude': longitude,
                'current': 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation,pressure_msl',
                'timezone': 'America/Sao_Paulo',
            }
            
            response = self.session.get(self.base_url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            current = data.get('current', {})
            
            weather_data = {
                'timestamp': datetime.now().isoformat(),
                'city': city_name,
                'latitude': latitude,
                'longitude': longitude,
                'temperature': current.get('temperature_2m', 0),
                'humidity': current.get('relative_humidity_2m', 0),
                'wind_speed': current.get('wind_speed_10m', 0),
                'rain_probability': current.get('precipitation', 0),
                'pressure': current.get('pressure_msl', 0),
                'weather_code': current.get('weather_code', 0),
                'description': self._get_weather_description(current.get('weather_code', 0)),
            }
            
            return weather_data
            
        except requests.RequestException as e:
            logger.error(f"Erro ao buscar dados de Open-Meteo: {e}")
            return None
        except Exception as e:
            logger.error(f"Erro ao processar dados: {e}")
            return None
    
    def _get_weather_description(self, code: int) -> str:
        """Mapeia código do Open-Meteo para descrição"""
        descriptions = {
            0: "Céu limpo",
            1: "Principalmente limpo",
            2: "Parcialmente nublado",
            3: "Nublado",
            45: "Nevoeiro",
            48: "Nevoeiro com geada",
            51: "Garoa leve",
            53: "Garoa moderada",
            55: "Garoa densa",
            61: "Chuva fraca",
            63: "Chuva moderada",
            65: "Chuva forte",
            80: "Chuva fraca por pancadas",
            81: "Chuva moderada por pancadas",
            82: "Chuva forte por pancadas",
            95: "Tempestade",
        }
        return descriptions.get(code, "Desconhecido")
