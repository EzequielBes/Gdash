import time
import logging
from datetime import datetime
from config import COLLECTION_INTERVAL, CITIES
from infrastructure.openmeteo_client import OpenMeteoClient
from infrastructure.rabbit_producer import RabbitProducer

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def main():
    logger.info("🌍 GDASH Collector iniciado")
    
    try:
        openmeteo = OpenMeteoClient()
        rabbit = RabbitProducer()
        
        logger.info(f"Coletando dados a cada {COLLECTION_INTERVAL} segundos")
        logger.info(f"Cidades: {', '.join([c['name'] for c in CITIES])}")
        
        while True:
            try:
                for city in CITIES:
                    logger.info(f"📍 Coletando dados de {city['name']}...")
                    
                    weather_data = openmeteo.get_weather(
                        latitude=city['latitude'],
                        longitude=city['longitude'],
                        city_name=city['name']
                    )
                    
                    if weather_data:
                        rabbit.publish(weather_data)
                        logger.info(f"✅ Dados de {city['name']} enviados para fila")
                    else:
                        logger.error(f"❌ Erro ao coletar dados de {city['name']}")
                
                logger.info(f"⏳ Próxima coleta em {COLLECTION_INTERVAL} segundos...")
                time.sleep(COLLECTION_INTERVAL)
                
            except Exception as e:
                logger.error(f"Erro durante coleta: {e}", exc_info=True)
                time.sleep(10)  # Aguardar antes de tentar novamente
                
    except Exception as e:
        logger.error(f"Erro fatal: {e}", exc_info=True)
        raise

if __name__ == '__main__':
    main()
