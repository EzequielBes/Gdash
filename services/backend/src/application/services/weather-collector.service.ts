import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WeatherService } from './weather.service';

const CITIES = [
  { name: 'São Paulo', lat: -23.5505, lon: -46.6333 },
  { name: 'Rio de Janeiro', lat: -22.9068, lon: -43.1729 },
  { name: 'Belo Horizonte', lat: -19.9167, lon: -43.9345 },
  { name: 'Curitiba', lat: -25.4284, lon: -49.2733 },
  { name: 'Salvador', lat: -12.9714, lon: -38.5014 },
  { name: 'Brasília', lat: -15.7939, lon: -47.8822 },
  { name: 'Recife', lat: -8.0476, lon: -34.8770 },
  { name: 'Manaus', lat: -3.1190, lon: -60.0217 },
];

@Injectable()
export class WeatherCollectorService {
  private readonly logger = new Logger(WeatherCollectorService.name);

  constructor(private readonly weatherService: WeatherService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async collectWeatherData() {
    this.logger.log('Starting weather data collection...');

    for (const city of CITIES) {
      try {
        await this.collectCityWeather(city);
      } catch (error) {
        this.logger.error(`Error collecting data for ${city.name}:`, error);
      }
    }

    this.logger.log('Weather data collection completed');
  }

  private async collectCityWeather(city: { name: string; lat: number; lon: number }) {
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,pressure_msl,precipitation_probability&timezone=America/Sao_Paulo`,
      );

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const data: any = await response.json();
      const current = data?.current;

      if (!current) {
        throw new Error('No current weather data in response');
      }

      const weatherLog = {
        timestamp: new Date(),
        city: city.name,
        latitude: city.lat,
        longitude: city.lon,
        temperature: current.temperature_2m || 0,
        humidity: current.relative_humidity_2m || 0,
        windSpeed: current.wind_speed_10m || 0,
        pressure: current.pressure_msl || 0,
        weatherCode: current.weather_code || 0,
        rainProbability: current.precipitation_probability || 0,
        description: this.getWeatherDescription(current.weather_code),
      };

      await this.weatherService.create(weatherLog);
      this.logger.log(`Successfully collected data for ${city.name}`);
    } catch (error) {
      this.logger.error(`Failed to collect data for ${city.name}:`, error);
    }
  }

  private getWeatherDescription(code: number): string {
    const codes: Record<number, string> = {
      0: 'Céu limpo',
      1: 'Parcialmente nublado',
      2: 'Nublado',
      3: 'Céu nublado',
      45: 'Névoa',
      48: 'Névoa com geada',
      51: 'Garoa leve',
      53: 'Garoa moderada',
      55: 'Garoa densa',
      61: 'Chuva leve',
      63: 'Chuva moderada',
      65: 'Chuva pesada',
      71: 'Neve leve',
      73: 'Neve moderada',
      75: 'Neve pesada',
      77: 'Grãos de neve',
      80: 'Pancadas de chuva leve',
      81: 'Pancadas de chuva moderada',
      82: 'Pancadas de chuva pesada',
      85: 'Pancadas de neve leve',
      86: 'Pancadas de neve pesada',
      95: 'Trovoada leve',
      96: 'Trovoada com granizo leve',
      99: 'Trovoada com granizo pesado',
    };

    return codes[code] || 'Desconhecido';
  }
}
