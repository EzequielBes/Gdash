package queue

import (
	"context"
	"time"

	"gdash-worker/internal/infrastructure/logger" // Import the custom logger
	"github.com/rabbitmq/amqp091-go"
)

// RabbitMQConsumer consumes messages from a RabbitMQ queue.
type RabbitMQConsumer struct {
	amqpURL    string
	queueName  string
	conn       *amqp091.Connection
	channel    *amqp091.Channel
	maxRetries int
	retryDelay time.Duration
	logger     *logger.Logger // Add the custom logger
}

// MessageHandler is a function that processes a message.
type MessageHandler func(ctx context.Context, body []byte) error

// NewRabbitMQConsumer creates a new RabbitMQConsumer.
func NewRabbitMQConsumer(amqpURL, queueName string, logger *logger.Logger) *RabbitMQConsumer {
	return &RabbitMQConsumer{
		amqpURL:    amqpURL,
		queueName:  queueName,
		maxRetries: 3,
		retryDelay: 5 * time.Second,
		logger:     logger,
	}
}

// StartConsumer starts the consumer and listens for messages.
func (c *RabbitMQConsumer) StartConsumer(ctx context.Context, handler MessageHandler) {
	var err error
	c.conn, err = amqp091.Dial(c.amqpURL)
	if err != nil {
		c.logger.Fatal("Failed to connect to RabbitMQ: %s", err)
	}
	defer c.conn.Close()

	c.channel, err = c.conn.Channel()
	if err != nil {
		c.logger.Fatal("Failed to open a channel: %s", err)
	}
	defer c.channel.Close()

	_, err = c.channel.QueueDeclare(
		c.queueName,
		true,  // durable
		false, // delete when unused
		false, // exclusive
		false, // no-wait
		nil,   // arguments
	)
	if err != nil {
		c.logger.Fatal("Failed to declare a queue: %s", err)
	}

	msgs, err := c.channel.Consume(
		c.queueName,
		"",    // consumer
		false, // auto-ack
		false, // exclusive
		false, // no-local
		false, // no-wait
		nil,   // args
	)
	if err != nil {
		c.logger.Fatal("Failed to register a consumer: %s", err)
	}

	forever := make(chan bool)

	go func() {
		for d := range msgs {
			c.logger.Info("Received a message: %s", d.Body)
			err := handler(ctx, d.Body)
			if err != nil {
				c.logger.Error("Error processing message: %s", err)
				// Implement basic retry logic
				if d.Redelivered {
					c.logger.Info("Message redelivered multiple times, rejecting.")
					d.Nack(false, false) // Nack and don't requeue
				} else {
					c.logger.Info("Nacking message for redelivery.")
					d.Nack(false, true) // Nack and requeue
				}
			} else {
				d.Ack(false) // Acknowledge the message
			}
		}
	}()

	c.logger.Info(" [*] Waiting for messages. To exit press CTRL+C")
	<-forever
}