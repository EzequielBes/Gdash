import os
from datetime import datetime

# Configurações
RABBITMQ_URL = os.getenv('RABBITMQ_URL', 'amqp://guest:guest@rabbitmq:5672')
OPENMETEO_API_URL = 'https://api.open-meteo.com/v1/forecast'

# Intervalo de coleta em segundos (1800 = 30 minutos)
COLLECTION_INTERVAL = int(os.getenv('COLLECTION_INTERVAL', 1800))

# Cidades a monitorar (lat/lon)
CITIES = [
    {
        'name': 'São Paulo',
        'latitude': -23.5505,
        'longitude': -46.6333,
    },
    {
        'name': 'Rio de Janeiro',
        'latitude': -22.9068,
        'longitude': -43.1729,
    },
    {
        'name': 'Brasília',
        'latitude': -15.7942,
        'longitude': -47.8822,
    },
]

LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
