package logger

import (
	"log"
	"os"
	"strings"
)

// Logger is a custom logger with leveled logging.
type Logger struct {
	minLevel logLevel
}

type logLevel int

const (
	levelDebug logLevel = iota
	levelInfo
	levelError
)

// NewLogger creates a new Logger instance.
func NewLogger(level string) *Logger {
	l := levelInfo // Default to INFO
	switch strings.ToLower(level) {
	case "debug":
		l = levelDebug
	case "info":
		l = levelInfo
	case "error":
		l = levelError
	}
	return &Logger{minLevel: l}
}

func (l *Logger) log(level logLevel, format string, v ...interface{}) {
	if level >= l.minLevel {
		prefix := ""
		switch level {
		case levelDebug:
			prefix = "[DEBUG] "
		case levelInfo:
			prefix = "[INFO] "
		case levelError:
			prefix = "[ERROR] "
		}
		log.Printf(prefix+format, v...)
	}
}

// Debug logs a debug message.
func (l *Logger) Debug(format string, v ...interface{}) {
	l.log(levelDebug, format, v...)
}

// Info logs an info message.
func (l *Logger) Info(format string, v ...interface{}) {
	l.log(levelInfo, format, v...)
}

// Error logs an error message.
func (l *Logger) Error(format string, v ...interface{}) {
	l.log(levelError, format, v...)
}

// Fatal logs a fatal message and exits.
func (l *Logger) Fatal(format string, v ...interface{}) {
	l.log(levelError, format, v...)
	os.Exit(1)
}
