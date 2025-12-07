import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, Inject, forwardRef } from '@nestjs/common';
import { WeatherLog } from '../../domain/entities/weather-log.entity';
import { WeatherLogRepository, PaginatedWeatherLogs, WeatherLogFilters } from '../../domain/repositories/weather-log.repository';
import { InsightsService } from './insights.service';

@Injectable()
export class WeatherService {
  constructor(
    private readonly weatherLogRepository: WeatherLogRepository,
    @Inject(forwardRef(() => InsightsService))
    private readonly insightsService: InsightsService,
  ) {}

  async create(data: any): Promise<WeatherLog> {
    try {
      if (!data.timestamp) {
        data.timestamp = new Date();
      } else if (typeof data.timestamp === 'string') {
        const parsed = new Date(data.timestamp);
        if (isNaN(parsed.getTime())) {
          throw new BadRequestException('Invalid timestamp format');
        }
        data.timestamp = parsed;
      }

      if (!data.temperature) {
        throw new BadRequestException('Temperature is required');
      }

      if (!data.latitude || !data.longitude) {
        data.latitude = data.latitude || 0;
        data.longitude = data.longitude || 0;
      }

      const created = await this.weatherLogRepository.create(data);
      
      // Trigger insights update asynchronously
      if (data.city) {
        this.insightsService.updateRealtimeInsights(data.city).catch(err => 
          console.error('Error updating insights:', err)
        );
      }

      return created;
    } catch (err) {
      console.error('Error creating weather log:', err);
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException('Failed to create weather log');
    }
  }

  async findAll(filters: WeatherLogFilters): Promise<PaginatedWeatherLogs> {
    try {
      const validFilters = {
        ...filters,
        page: Math.max(filters.page || 1, 1),
        limit: Math.min(Math.max(filters.limit || 10, 1), 1000),
      };
      return this.weatherLogRepository.findAll(validFilters);
    } catch (err) {
      console.error('Error finding weather logs:', err);
      throw new InternalServerErrorException('Failed to fetch weather logs');
    }
  }

  async findById(id: string): Promise<WeatherLog | null> {
    try {
      if (!id || typeof id !== 'string' || id.trim().length === 0) {
        throw new BadRequestException('Invalid weather log ID');
      }
      const log = await this.weatherLogRepository.findById(id);
      if (!log) {
        throw new NotFoundException('Weather log not found');
      }
      return log;
    } catch (err) {
      if (err instanceof NotFoundException || err instanceof BadRequestException) throw err;
      console.error('Error finding weather log:', err);
      throw new InternalServerErrorException('Failed to fetch weather log');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      if (!id || typeof id !== 'string' || id.trim().length === 0) {
        throw new BadRequestException('Invalid weather log ID');
      }
      const log = await this.weatherLogRepository.findById(id);
      if (!log) {
        throw new NotFoundException('Weather log not found');
      }
      return this.weatherLogRepository.delete(id);
    } catch (err) {
      if (err instanceof NotFoundException || err instanceof BadRequestException) throw err;
      console.error('Error deleting weather log:', err);
      throw new InternalServerErrorException('Failed to delete weather log');
    }
  }

  async getLogs(): Promise<WeatherLog[]> {
    try {
      const result = await this.weatherLogRepository.findAll({ limit: 10000 });
      return result.data || [];
    } catch (err) {
      console.error('Error fetching logs:', err);
      return [];
    }
  }

  async getTodayInsights(city?: string, lat?: number, lon?: number) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const filters: any = { 
        startDate: today,
        limit: 1000 
      };

      if (city) {
        filters.city = city;
      }

      const logs = await this.weatherLogRepository.findAll(filters);

      // Forecast analysis
      let rainForecast = "Sem dados de previsão.";
      try {
        if (city && (!lat || !lon)) {
           const coords = await this.resolveCity(city);
           if (coords) {
             lat = coords.latitude;
             lon = coords.longitude;
           }
        }

        if (lat && lon) {
          const forecast = await this.getForecast(city || '', lat, lon);
          if (forecast && forecast.hourly) {
            const now = new Date();
            const currentHourIndex = forecast.hourly.time.findIndex((t: string) => new Date(t).getTime() >= now.getTime());
            
            if (currentHourIndex !== -1) {
              const nextHours = forecast.hourly.precipitation_probability.slice(currentHourIndex, currentHourIndex + 6);
              const maxRainProb = Math.max(...nextHours);
              
              if (maxRainProb > 70) {
                rainForecast = "Alta probabilidade de chuva nas próximas horas.";
              } else if (maxRainProb > 30) {
                rainForecast = "Possibilidade de chuva leve nas próximas horas.";
              } else {
                rainForecast = "Sem previsão de chuva significativa para as próximas horas.";
              }
            }
          }
        }
      } catch (e) {
        console.error("Error fetching forecast for insights", e);
      }

      if (!logs.data || logs.data.length === 0) {
        return {
          averageTemperature: 0,
          maxTemperature: 0,
          minTemperature: 0,
          averageHumidity: 0,
          logCount: 0,
          rainForecast
        };
      }

      const temps = logs.data
        .map(l => parseFloat((l.temperature || 0).toString()))
        .filter(t => !isNaN(t));
      
      const humidities = logs.data
        .map(l => parseFloat((l.humidity || 0).toString()))
        .filter(h => !isNaN(h));

      if (temps.length === 0) {
        return {
          averageTemperature: 0,
          maxTemperature: 0,
          minTemperature: 0,
          averageHumidity: 0,
          logCount: 0,
          rainForecast
        };
      }

      const avgTemp = Math.round((temps.reduce((a, b) => a + b, 0) / temps.length) * 10) / 10;
      const maxTemp = Math.max(...temps);
      const minTemp = Math.min(...temps);
      const avgHum = humidities.length > 0 
          ? Math.round((humidities.reduce((a, b) => a + b, 0) / humidities.length) * 10) / 10
          : 0;

      const windSpeeds = logs.data
        .map(l => parseFloat((l.windSpeed || 0).toString()))
        .filter(w => !isNaN(w));
      const maxWindSpeed = windSpeeds.length > 0 ? Math.max(...windSpeeds) : 0;

      const rainProbs = logs.data
        .map(l => parseFloat((l.rainProbability || 0).toString()))
        .filter(r => !isNaN(r));
      const rainChance = rainProbs.length > 0 ? Math.max(...rainProbs) : 0;

      const alerts: string[] = [];
      let summary = "Clima estável.";

      if (maxTemp > 30) alerts.push("Calor extremo");
      if (minTemp < 10) alerts.push("Frio intenso");
      if (avgHum < 30) alerts.push("Baixa umidade");
      if (avgHum > 80) alerts.push("Alta umidade");
      if (maxWindSpeed > 20) alerts.push("Vento forte");
      if (rainChance > 50) alerts.push("Alta chance de chuva");

      if (maxTemp > 25 && avgHum < 60) {
        summary = "Dia quente e seco. Hidrate-se!";
      } else if (maxTemp < 18) {
        summary = "Dia frio. Agasalhe-se bem.";
      } else if (rainChance > 70) {
        summary = "Alta probabilidade de chuva. Leve um guarda-chuva!";
      } else if (avgHum > 80) {
        summary = "Tempo úmido. Possibilidade de chuva.";
      } else {
        summary = "Clima agradável para atividades ao ar livre.";
      }

      return {
        averageTemperature: avgTemp,
        maxTemperature: maxTemp,
        minTemperature: minTemp,
        averageHumidity: avgHum,
        maxWindSpeed,
        rainChance,
        logCount: logs.data.length,
        alerts,
        summary,
        rainForecast
      };
    } catch (err) {
      console.error('Error getting today insights:', err);
      return {
        averageTemperature: 0,
        maxTemperature: 0,
        minTemperature: 0,
        averageHumidity: 0,
        logCount: 0,
        rainForecast: "Erro ao gerar previsão."
      };
    }
  }

  async getForecast(city: string, lat?: number, lon?: number) {
    try {
      if (!lat || !lon) {
        const coords = await this.getCoordinates(city);
        if (!coords) {
           throw new NotFoundException(`Coordinates not found for city: ${city}`);
        }
        lat = coords.latitude;
        lon = coords.longitude;
      }

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation_probability,weather_code&timezone=auto&forecast_days=3`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Open-Meteo API error: ${response.status}`);
      }

      const data = (await response.json()) as any;
      return {
        hourly: {
          time: data.hourly.time,
          temperature_2m: data.hourly.temperature_2m,
          precipitation_probability: data.hourly.precipitation_probability,
          weather_code: data.hourly.weather_code
        }
      };
    } catch (err) {
      console.error('Error fetching forecast:', err);
      throw new InternalServerErrorException('Failed to fetch forecast data');
    }
  }

  async fetchAndStoreWeather(city: string, lat?: number, lon?: number): Promise<WeatherLog> {
    try {
      if (!city || typeof city !== 'string' || city.trim().length === 0) {
        throw new BadRequestException('Invalid city name');
      }

      if (!lat || !lon) {
        const coords = await this.getCoordinates(city);
        if (!coords) {
           throw new NotFoundException(`Coordinates not found for city: ${city}`);
        }
        lat = coords.latitude;
        lon = coords.longitude;
        if (coords.name) {
          city = coords.name;
        }
      }

      const weatherData = await this.fetchFromOpenMeteo(lat, lon);
      
      return await this.create({
        city: city.trim(),
        temperature: weatherData.temperature,
        humidity: weatherData.humidity,
        windSpeed: weatherData.windSpeed,
        rainProbability: weatherData.rainProbability,
        pressure: weatherData.pressure,
        weatherCode: weatherData.weatherCode,
        description: weatherData.description,
        timestamp: new Date(),
        latitude: lat,
        longitude: lon,
      });
    } catch (err) {
      console.error('Error fetching weather:', err);
      throw err;
    }
  }

  async resolveCity(city: string): Promise<{ name: string; latitude: number; longitude: number } | null> {
    return this.getCoordinates(city);
  }

  private async getCoordinates(city: string): Promise<{ name: string; latitude: number; longitude: number } | null> {
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=pt&format=json`;
      const response = await fetch(url);
      if (!response.ok) return null;
      
      const data = (await response.json()) as any;
      if (!data.results || data.results.length === 0) return null;
      
      return {
        name: `${data.results[0].name} (${data.results[0].country_code || ''})`.trim().replace(' ()', ''),
        latitude: data.results[0].latitude,
        longitude: data.results[0].longitude
      };
    } catch (err) {
      console.error('Error fetching coordinates:', err);
      return null;
    }
  }

  private async fetchFromOpenMeteo(latitude: number, longitude: number): Promise<any> {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,pressure_msl,rain&timezone=auto`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Open-Meteo API error: ${response.status}`);
      }

      const data = (await response.json()) as any;
      const current = data?.current || {};

      return {
        temperature: current.temperature_2m || 0,
        humidity: current.relative_humidity_2m || 0,
        windSpeed: current.wind_speed_10m || 0,
        rainProbability: current.rain || 0,
        pressure: current.pressure_msl || 0,
        weatherCode: current.weather_code || 0,
        description: this.getWeatherDescription(current.weather_code || 0),
      };
    } catch (err) {
      console.error('Error fetching from Open-Meteo:', err);
      throw new InternalServerErrorException('Failed to fetch real weather data from Open-Meteo');
    }
  }

  private getWeatherDescription(code: number): string {
    const descriptions: { [key: number]: string } = {
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
    };
    return descriptions[code] || 'Clima desconhecido';
  }

  async getWeatherHistory(city: string, days: number): Promise<WeatherLog[]> {
    try {
      if (!city || typeof city !== 'string' || city.trim().length === 0) {
        throw new BadRequestException('Invalid city name');
      }

      const daysNum = Math.max(Math.min(days, 365), 1);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysNum);

      const result = await this.weatherLogRepository.findAll({
        city: city.trim(),
        startDate,
        limit: 1000,
      });

      return result.data || [];
    } catch (err) {
      console.error('Error fetching weather history:', err);
      return [];
    }
  }

  async getWeatherById(id: string): Promise<WeatherLog | null> {
    return this.findById(id);
  }

  async deleteWeatherLog(id: string): Promise<void> {
    return this.delete(id);
  }
}
