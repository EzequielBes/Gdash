import json
import time
import requests
import pika
import os
import logging
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=os.getenv('LOG_LEVEL', 'INFO'))
logger = logging.getLogger(__name__)

RABBITMQ_URL = os.getenv('RABBITMQ_URL', 'amqp://guest:guest@localhost:5672')
OPENMETEO_API = 'https://api.open-meteo.com/v1/forecast'

# Cidades para coletar dados
CITIES = [
    {'name': 'São Paulo', 'latitude': -23.5505, 'longitude': -46.6333},
    {'name': 'Rio de Janeiro', 'latitude': -22.9068, 'longitude': -43.1729},
    {'name': 'Brasília', 'latitude': -15.7975, 'longitude': -47.8919},
]

def get_weather_description(code):
    descriptions = {
        0: 'Céu limpo',
        1: 'Principalmente nublado',
        2: 'Parcialmente nublado',
        3: 'Nublado',
        45: 'Névoa',
        48: 'Névoa congelada',
        51: 'Chuva leve',
        53: 'Chuva moderada',
        55: 'Chuva forte',
        61: 'Chuva fraca',
        63: 'Chuva moderada',
        65: 'Chuva forte',
        71: 'Neve fraca',
        73: 'Neve moderada',
        75: 'Neve forte',
        77: 'Granizo',
        80: 'Pancadas de chuva fraca',
        81: 'Pancadas de chuva',
        82: 'Pancadas de chuva forte',
        85: 'Pancadas de neve fraca',
        86: 'Pancadas de neve forte',
        95: 'Tempestade',
        96: 'Tempestade com granizo fraco',
        99: 'Tempestade com granizo forte',
    }
    return descriptions.get(code, 'Clima desconhecido')

def get_weather_data(city):
    """Coleta dados de uma cidade via Open-Meteo API"""
    try:
        params = {
            'latitude': city['latitude'],
            'longitude': city['longitude'],
            'current': 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
            'timezone': 'America/Sao_Paulo'
        }
        
        response = requests.get(OPENMETEO_API, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        current = data.get('current', {})
        weather_code = int(current.get('weather_code', 0))
        
        return {
            'timestamp': datetime.now().isoformat() + 'Z',
            'city': city['name'],
            'latitude': city['latitude'],
            'longitude': city['longitude'],
            'temperature': float(current.get('temperature_2m', 0)),
            'humidity': int(current.get('relative_humidity_2m', 0)),
            'wind_speed': float(current.get('wind_speed_10m', 0)),
            'weather_code': weather_code,
            'description': get_weather_description(weather_code),
        }
    except Exception as e:
        logger.error(f"Erro ao coletar dados de {city['name']}: {e}")
        return None

def send_to_rabbitmq(data):
    """Envia dados para a fila RabbitMQ"""
    try:
        connection = pika.BlockingConnection(pika.URLParameters(RABBITMQ_URL))
        channel = connection.channel()
        
        channel.queue_declare(queue='weather_data', durable=True)
        
        channel.basic_publish(
            exchange='',
            routing_key='weather_data',
            body=json.dumps(data),
            properties=pika.BasicProperties(delivery_mode=2)
        )
        
        connection.close()
        logger.info(f"✅ Dados de {data['city']} enviados para fila")
        return True
    except Exception as e:
        logger.error(f"❌ Erro ao enviar para RabbitMQ: {e}")
        return False

def main():
    """Loop principal do collector"""
    logger.info("🌍 Iniciando GDASH Weather Collector...")
    
    while True:
        try:
            for city in CITIES:
                logger.info(f"📍 Coletando dados de {city['name']}...")
                weather_data = get_weather_data(city)
                
                if weather_data:
                    send_to_rabbitmq(weather_data)
            
            # Esperar 30 minutos antes da próxima coleta
            logger.info("⏳ Aguardando próxima coleta em 30 minutos...")
            time.sleep(1800)  # 30 minutos em modo produção - 30 segundos para teste
            
        except KeyboardInterrupt:
            logger.info("⛔ Collector interrompido")
            break
        except Exception as e:
            logger.error(f"Erro no loop: {e}")
            time.sleep(60)

if __name__ == '__main__':
    main()
