import pika

from src.domain.interfaces import QueuePublisher


class RabbitMQPublisher(QueuePublisher):
    """
    A queue publisher for RabbitMQ.
    """

    def __init__(self, amqp_url: str, queue_name: str):
        self.amqp_url = amqp_url
        self.queue_name = queue_name
        self.connection = None
        self.channel = None

    def __enter__(self):
        self.connection = pika.BlockingConnection(pika.URLParameters(self.amqp_url))
        self.channel = self.connection.channel()
        self.channel.queue_declare(queue=self.queue_name, durable=True)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.connection:
            self.connection.close()

    def publish(self, message: str):
        """
        Publishes a message to the RabbitMQ queue.
        """
        if not self.channel:
            raise ConnectionError("RabbitMQ connection not established.")

        self.channel.basic_publish(
            exchange="",
            routing_key=self.queue_name,
            body=message,
            properties=pika.BasicProperties(
                delivery_mode=2,  # make message persistent
            ),
        )
