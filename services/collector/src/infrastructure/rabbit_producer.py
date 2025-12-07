import json
import logging
import pika
import sys
sys.path.insert(0, '/app')
from config import RABBITMQ_URL

logger = logging.getLogger(__name__)

class RabbitProducer:
    def __init__(self):
        self.url = RABBITMQ_URL
        self.queue_name = 'weather_data'
    
    def publish(self, message: dict):
        """Publica mensagem na fila RabbitMQ"""
        try:
            params = pika.URLParameters(self.url)
            connection = pika.BlockingConnection(params)
            channel = connection.channel()
            
            channel.queue_declare(queue=self.queue_name, durable=True)
            
            message_json = json.dumps(message)
            channel.basic_publish(
                exchange='',
                routing_key=self.queue_name,
                body=message_json,
                properties=pika.BasicProperties(delivery_mode=2)
            )
            
            connection.close()
            logger.info(f"Mensagem publicada: {message.get('city')}")
            
        except Exception as e:
            logger.error(f"Erro ao publicar: {e}")
