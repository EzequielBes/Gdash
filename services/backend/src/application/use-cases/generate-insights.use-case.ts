import { Injectable, Inject } from '@nestjs/common';
import { WeatherLogRepository } from '../../domain/repositories/weather-log.repository';
import {
  Insights,
  TemperatureTrend,
  DayClassification,
  Alert,
} from '../../domain/entities/insights.entity';

@Injectable()
export class GenerateInsightsUseCase {
  constructor(
    @Inject(WeatherLogRepository)
    private readonly weatherLogRepository: WeatherLogRepository,
  ) {}

  async execute(): Promise<Insights> {
    const { data: logs } = await this.weatherLogRepository.findAll({}); // Pass empty filter object
    if (logs.length === 0) {
      return {
        date: new Date(),
        summary: 'Not enough data to generate insights.',
        averageTemperature: 0,
        maxTemperature: 0,
        minTemperature: 0,
        averageHumidity: 0,
        temperatureTrend: TemperatureTrend.STABLE,
        comfortScore: 0,
        dayClassification: DayClassification.PLEASANT,
        alerts: [],
      };
    }

    const temperatures = logs.map((log) => log.temperature);
    const humidities = logs.map((log) => log.humidity);
    const windSpeeds = logs.map((log) => log.windSpeed);
    const rainProbabilities = logs.map((log) => log.rainProbability || 0);

    const averageTemperature =
      temperatures.reduce((a, b) => a + b, 0) / temperatures.length;
    const maxTemperature = Math.max(...temperatures);
    const minTemperature = Math.min(...temperatures);
    const averageHumidity =
      humidities.reduce((a, b) => a + b, 0) / humidities.length;

    let temperatureTrend: TemperatureTrend = TemperatureTrend.STABLE;
    if (logs.length > 1) {
      const firstHalfAvg =
        temperatures
          .slice(0, Math.floor(temperatures.length / 2))
          .reduce((sum, temp) => sum + temp, 0) / Math.floor(temperatures.length / 2);
      const secondHalfAvg =
        temperatures
          .slice(Math.ceil(temperatures.length / 2))
          .reduce((sum, temp) => sum + temp, 0) / Math.ceil(temperatures.length / 2);

      if (secondHalfAvg > firstHalfAvg + 1) {
        temperatureTrend = TemperatureTrend.RISING;
      } else if (secondHalfAvg < firstHalfAvg - 1) {
        temperatureTrend = TemperatureTrend.FALLING;
      }
    }

    const comfortScore = 0; // To be implemented in InsightsService
    const dayClassification: DayClassification = DayClassification.PLEASANT; // To be implemented in InsightsService
    const alerts: Alert[] = []; // To be implemented in InsightsService

    const summary = `The average temperature is ${averageTemperature.toFixed(
      2,
    )}°C. The temperature is currently ${temperatureTrend}.`;

    return {
      date: new Date(),
      summary,
      averageTemperature,
      maxTemperature,
      minTemperature,
      averageHumidity,
      temperatureTrend,
      comfortScore,
      dayClassification,
      alerts,
    };
  }
}
