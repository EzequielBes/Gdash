# Collector Configuration

## Environment Variables

```
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
OPENWEATHER_API_KEY=
OPENMETEO_API_URL=https://api.open-meteo.com/v1
LATITUDE=23.5505
LONGITUDE=46.6333
CITY_NAME=São Paulo
COLLECTION_INTERVAL=3600
LOG_LEVEL=info
```

## Setup

1. Create virtual environment: `python -m venv venv`
2. Activate: `source venv/bin/activate` (Linux/Mac) or `venv\Scripts\activate` (Windows)
3. Install dependencies: `pip install -r requirements.txt`
4. Run: `python -m src.main`

## Requirements

- Python 3.9+
- requests
- pika
- python-dotenv
- pandas (optional, for data processing)

## Testing

```bash
python -m pytest
```
