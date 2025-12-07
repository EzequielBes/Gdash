package queue

import (
	"context"
	"errors"
	"testing"
	"time"

	"gdash-worker/internal/infrastructure/logger" // Import the custom logger
	"github.com/rabbitmq/amqp091-go"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockChannel is a mock implementation of amqp091.Channel
type MockChannel struct {
	mock.Mock
}

func (m *MockChannel) QueueDeclare(name string, durable, autoDelete, exclusive, noWait bool, args amqp091.Table) (amqp091.Queue, error) {
	argsM := m.Called(name, durable, autoDelete, exclusive, noWait, args)
	return argsM.Get(0).(amqp091.Queue), argsM.Error(1)
}

func (m *MockChannel) Consume(queue, consumer string, autoAck, exclusive, noLocal, noWait bool, args amqp091.Table) (<-chan amqp091.Delivery, error) {
	argsM := m.Called(queue, consumer, autoAck, exclusive, noLocal, noWait, args)
	return argsM.Get(0).(<-chan amqp091.Delivery), argsM.Error(1)
}

func (m *MockChannel) Ack(tag uint64, multiple bool) error {
	argsM := m.Called(tag, multiple)
	return argsM.Error(0)
}

func (m *MockChannel) Nack(tag uint64, multiple, requeue bool) error {
	argsM := m.Called(tag, multiple, requeue)
	return argsM.Error(0)
}

func (m *MockChannel) Close() error {
	argsM := m.Called()
	return argsM.Error(0)
}

// MockConnection is a mock implementation of amqp091.Connection
type MockConnection struct {
	mock.Mock
}

func (m *MockConnection) Channel() (*amqp091.Channel, error) {
	args := m.Called()
	return args.Get(0).(*amqp091.Channel), args.Error(1)
}

func (m *MockConnection) Close() error {
	args := m.Called()
	return args.Error(0)
}

// MockDial is a mock function for amqp091.Dial
var MockDial = func(url string) (*amqp091.Connection, error) {
	args := new(mock.Mock).Called(url)
	return args.Get(0).(*amqp091.Connection), args.Error(1)
}

func TestNewRabbitMQConsumer(t *testing.T) {
	log := logger.NewLogger("debug")
	consumer := NewRabbitMQConsumer("amqp://localhost", "test_queue", log)
	assert.NotNil(t, consumer)
	assert.Equal(t, "amqp://localhost", consumer.amqpURL)
	assert.Equal(t, "test_queue", consumer.queueName)
}

func TestStartConsumer_ConnectionFailure(t *testing.T) {
	log := logger.NewLogger("debug")
	consumer := NewRabbitMQConsumer("invalid_url", "test_queue", log)

	MockDial = func(url string) (*amqp091.Connection, error) {
		return nil, errors.New("connection failed")
	}

	// Capture log.Fatal output to assert it
	oldOsExit := osExit
	var fatalCalled bool
	osExit = func(code int) {
		fatalCalled = true
	}
	defer func() { osExit = oldOsExit }()

	go consumer.StartConsumer(context.Background(), func(ctx context.Context, body []byte) error { return nil })

	// Wait for the goroutine to execute
	time.Sleep(100 * time.Millisecond)
	assert.True(t, fatalCalled)
}

func TestStartConsumer_ChannelFailure(t *testing.T) {
	log := logger.NewLogger("debug")
	consumer := NewRabbitMQConsumer("amqp://localhost", "test_queue", log)

	mockConn := new(MockConnection)
	mockConn.On("Channel").Return(nil, errors.New("channel failed")).Once()
	mockConn.On("Close").Return(nil)

	MockDial = func(url string) (*amqp091.Connection, error) {
		return mockConn, nil
	}

	oldOsExit := osExit
	var fatalCalled bool
	osExit = func(code int) {
		fatalCalled = true
	}
	defer func() { osExit = oldOsExit }()

	go consumer.StartConsumer(context.Background(), func(ctx context.Context, body []byte) error { return nil })

	time.Sleep(100 * time.Millisecond)
	assert.True(t, fatalCalled)
	mockConn.AssertExpectations(t)
}

func TestStartConsumer_QueueDeclareFailure(t *testing.T) {
	log := logger.NewLogger("debug")
	consumer := NewRabbitMQConsumer("amqp://localhost", "test_queue", log)

	mockConn := new(MockConnection)
	mockChannel := new(MockChannel)

	mockConn.On("Channel").Return(mockChannel, nil).Once()
	mockConn.On("Close").Return(nil)
	mockChannel.On("QueueDeclare", "test_queue", true, false, false, false, amqp091.Table(nil)).Return(amqp091.Queue{}, errors.New("declare failed")).Once()
	mockChannel.On("Close").Return(nil)

	MockDial = func(url string) (*amqp091.Connection, error) {
		return mockConn, nil
	}

	oldOsExit := osExit
	var fatalCalled bool
	osExit = func(code int) {
		fatalCalled = true
	}
	defer func() { osExit = oldOsExit }()

	go consumer.StartConsumer(context.Background(), func(ctx context.Context, body []byte) error { return nil })

	time.Sleep(100 * time.Millisecond)
	assert.True(t, fatalCalled)
	mockConn.AssertExpectations(t)
	mockChannel.AssertExpectations(t)
}

func TestStartConsumer_ConsumeFailure(t *testing.T) {
	log := logger.NewLogger("debug")
	consumer := NewRabbitMQConsumer("amqp://localhost", "test_queue", log)

	mockConn := new(MockConnection)
	mockChannel := new(MockChannel)

	mockConn.On("Channel").Return(mockChannel, nil).Once()
	mockConn.On("Close").Return(nil)
	mockChannel.On("QueueDeclare", "test_queue", true, false, false, false, amqp091.Table(nil)).Return(amqp091.Queue{}, nil).Once()
	mockChannel.On("Consume", "test_queue", "", false, false, false, false, amqp091.Table(nil)).Return(nil, errors.New("consume failed")).Once()
	mockChannel.On("Close").Return(nil)

	MockDial = func(url string) (*amqp091.Connection, error) {
		return mockConn, nil
	}

	oldOsExit := osExit
	var fatalCalled bool
	osExit = func(code int) {
		fatalCalled = true
	}
	defer func() { osExit = oldOsExit }()

	go consumer.StartConsumer(context.Background(), func(ctx context.Context, body []byte) error { return nil })

	time.Sleep(100 * time.Millisecond)
	assert.True(t, fatalCalled)
	mockConn.AssertExpectations(t)
	mockChannel.AssertExpectations(t)
}

func TestStartConsumer_ProcessMessageSuccess(t *testing.T) {
	log := logger.NewLogger("debug")
	consumer := NewRabbitMQConsumer("amqp://localhost", "test_queue", log)

	mockConn := new(MockConnection)
	mockChannel := new(MockChannel)

	deliveryChannel := make(chan amqp091.Delivery, 1)
	deliveryChannel <- amqp091.Delivery{
		Body: []byte("test message"),
		ConsumerTag: "consumer1",
		DeliveryTag: 1,
	}
	close(deliveryChannel)

	mockConn.On("Channel").Return(mockChannel, nil).Once()
	mockConn.On("Close").Return(nil)
	mockChannel.On("QueueDeclare", "test_queue", true, false, false, false, amqp091.Table(nil)).Return(amqp091.Queue{}, nil).Once()
	mockChannel.On("Consume", "test_queue", "", false, false, false, false, amqp091.Table(nil)).Return(deliveryChannel, nil).Once()
	mockChannel.On("Ack", uint64(1), false).Return(nil).Once()
	mockChannel.On("Close").Return(nil)

	MockDial = func(url string) (*amqp091.Connection, error) {
		return mockConn, nil
	}

	handlerCalled := make(chan bool, 1)
	handler := func(ctx context.Context, body []byte) error {
		assert.Equal(t, []byte("test message"), body)
		handlerCalled <- true
		return nil
	}

	go consumer.StartConsumer(context.Background(), handler)

	select {
	case <-handlerCalled:
		// Handler was called
	case <-time.After(500 * time.Millisecond):
		t.Fatal("Handler was not called in time")
	}

	time.Sleep(100 * time.Millisecond) // Give time for Ack to be called
	mockConn.AssertExpectations(t)
	mockChannel.AssertExpectations(t)
}

func TestStartConsumer_ProcessMessageFailureAndRequeue(t *testing.T) {
	log := logger.NewLogger("debug")
	consumer := NewRabbitMQConsumer("amqp://localhost", "test_queue", log)

	mockConn := new(MockConnection)
	mockChannel := new(MockChannel)

	deliveryChannel := make(chan amqp091.Delivery, 1)
	deliveryChannel <- amqp091.Delivery{
		Body: []byte("test message"),
		ConsumerTag: "consumer1",
		DeliveryTag: 1,
		Redelivered: false, // First delivery
	}
	close(deliveryChannel)

	mockConn.On("Channel").Return(mockChannel, nil).Once()
	mockConn.On("Close").Return(nil)
	mockChannel.On("QueueDeclare", "test_queue", true, false, false, false, amqp091.Table(nil)).Return(amqp091.Queue{}, nil).Once()
	mockChannel.On("Consume", "test_queue", "", false, false, false, false, amqp091.Table(nil)).Return(deliveryChannel, nil).Once()
	mockChannel.On("Nack", uint64(1), false, true).Return(nil).Once() // Nack and requeue
	mockChannel.On("Close").Return(nil)

	MockDial = func(url string) (*amqp091.Connection, error) {
		return mockConn, nil
	}

	handlerCalled := make(chan bool, 1)
	handler := func(ctx context.Context, body []byte) error {
		handlerCalled <- true
		return errors.New("processing error") // Simulate failure
	}

	go consumer.StartConsumer(context.Background(), handler)

	select {
	case <-handlerCalled:
		// Handler was called
	case <-time.After(500 * time.Millisecond):
		t.Fatal("Handler was not called in time")
	}

	time.Sleep(100 * time.Millisecond) // Give time for Nack to be called
	mockConn.AssertExpectations(t)
	mockChannel.AssertExpectations(t)
}

func TestStartConsumer_ProcessMessageFailureAndReject(t *testing.T) {
	log := logger.NewLogger("debug")
	consumer := NewRabbitMQConsumer("amqp://localhost", "test_queue", log)

	mockConn := new(MockConnection)
	mockChannel := new(MockChannel)

	deliveryChannel := make(chan amqp091.Delivery, 1)
	deliveryChannel <- amqp091.Delivery{
		Body: []byte("test message"),
		ConsumerTag: "consumer1",
		DeliveryTag: 1,
		Redelivered: true, // Already redelivered
	}
	close(deliveryChannel)

	mockConn.On("Channel").Return(mockChannel, nil).Once()
	mockConn.On("Close").Return(nil)
	mockChannel.On("QueueDeclare", "test_queue", true, false, false, false, amqp091.Table(nil)).Return(amqp091.Queue{}, nil).Once()
	mockChannel.On("Consume", "test_queue", "", false, false, false, false, amqp091.Table(nil)).Return(deliveryChannel, nil).Once()
	mockChannel.On("Nack", uint64(1), false, false).Return(nil).Once() // Nack and don't requeue
	mockChannel.On("Close").Return(nil)

	MockDial = func(url string) (*amqp091.Connection, error) {
		return mockConn, nil
	}

	handlerCalled := make(chan bool, 1)
	handler := func(ctx context.Context, body []byte) error {
		handlerCalled <- true
		return errors.New("processing error") // Simulate failure
	}

	go consumer.StartConsumer(context.Background(), handler)

	select {
	case <-handlerCalled:
		// Handler was called
	case <-time.After(500 * time.Millisecond):
		t.Fatal("Handler was not called in time")
	}

	time.Sleep(100 * time.Millisecond) // Give time for Nack to be called
	mockConn.AssertExpectations(t)
	mockChannel.AssertExpectations(t)
}

// osExit is a variable that can be overridden for testing purposes.
var osExit = os.Exit
