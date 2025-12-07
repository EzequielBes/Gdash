import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WeatherLogRepository } from '../../domain/repositories/weather-log.repository';
import {
  Insights,
  TemperatureTrend,
  DayClassification,
  Alert,
} from '../../domain/entities/insights.entity';
import { InsightsRepository } from '../../domain/repositories/insights.repository';
import { WeatherLog } from '../../domain/entities/weather-log.entity';
import { AIInsightsService } from './ai-insights.service';

@Injectable()
export class InsightsService {
  private readonly logger = new Logger(InsightsService.name);

  constructor(
    @Inject(WeatherLogRepository)
    private readonly weatherLogRepository: WeatherLogRepository,
    @Inject(InsightsRepository)
    private readonly insightsRepository: InsightsRepository,
    private readonly aiService: AIInsightsService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleScheduledInsights() {
    this.logger.log('Running scheduled insights generation...');
    // Get list of cities from logs (simplified: just hardcoded or distinct query)
    // For now, let's assume we want to update for 'São Paulo' as default or fetch distinct cities
    const cities = ['São Paulo', 'Rio de Janeiro']; // This should be dynamic
    for (const city of cities) {
      await this.updateRealtimeInsights(city);
    }
  }

  async updateRealtimeInsights(city: string): Promise<Insights | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: logs } = await this.weatherLogRepository.findAll({
      startDate: today,
      endDate: tomorrow,
      city,
      limit: 1000,
    });

    if (!logs.length) {
      return null;
    }

    const latestLog = logs[logs.length - 1];
    const history = logs.slice(0, -1); // All except last

    // Calculate stats
    const temperatures = logs.map((log) => log.temperature);
    const humidities = logs.map((log) => log.humidity);
    const windSpeeds = logs.map((log) => log.windSpeed);
    const rainProbabilities = logs.map((log) => log.rainProbability || 0);

    const averageTemperature =
      temperatures.reduce((sum, temp) => sum + temp, 0) / temperatures.length;
    const maxTemperature = Math.max(...temperatures);
    const minTemperature = Math.min(...temperatures);
    const averageHumidity =
      humidities.reduce((sum, hum) => sum + hum, 0) / humidities.length;

    const temperatureTrend = this.getTrend(temperatures);
    const comfortScore = this.getComfortScore(
      averageTemperature,
      averageHumidity,
      windSpeeds.reduce((sum, ws) => sum + ws, 0) / windSpeeds.length,
    );
    const alerts = this.generateAlerts(logs);
    const dayClassification = this.classifyDay(
      averageTemperature,
      averageHumidity,
      rainProbabilities.reduce((sum, rp) => sum + rp, 0) / rainProbabilities.length,
    );

    // Generate AI Summary
    let summary = '';
    try {
      summary = await this.aiService.generateInsight({
        current: latestLog,
        history: logs.slice(-10), // Last 10 for context
      });
    } catch (e) {
      this.logger.error('Failed to generate AI insight', e);
      summary = this.generateSummary({
        date: today,
        averageTemperature,
        maxTemperature,
        minTemperature,
        averageHumidity,
        temperatureTrend,
        comfortScore,
        dayClassification,
        alerts,
      } as Insights);
    }

    const insights: Insights = {
      date: today,
      averageTemperature,
      maxTemperature,
      minTemperature,
      averageHumidity,
      temperatureTrend,
      comfortScore,
      dayClassification,
      alerts,
      summary,
      generatedAt: new Date(),
    };

    // Save or Update
    // Note: InsightsRepository needs to support finding by Date AND City if we want per-city insights
    // For now, assuming global or single city, or we need to update repository.
    // Let's just return it for now, or save if repository supports it.
    
    // Assuming we want to persist:
    // const existing = await this.insightsRepository.findByDate(today);
    // if (existing) ...
    
    return insights;
  }

  async generateInsights(
    startDate: Date,
    endDate: Date,
  ): Promise<Insights | null> {
    this.logger.log(`Generating insights for ${startDate} to ${endDate}`);
    const { data: logs } = await this.weatherLogRepository.findAll({
      startDate,
      endDate,
    });

    if (!logs.length) {
      return null;
    }

    const temperatures = logs.map((log) => log.temperature);
    const humidities = logs.map((log) => log.humidity);
    const windSpeeds = logs.map((log) => log.windSpeed);
    const rainProbabilities = logs.map((log) => log.rainProbability || 0);

    const averageTemperature =
      temperatures.reduce((sum, temp) => sum + temp, 0) / temperatures.length;
    const maxTemperature = Math.max(...temperatures);
    const minTemperature = Math.min(...temperatures);
    const averageHumidity =
      humidities.reduce((sum, hum) => sum + hum, 0) / humidities.length;

    const temperatureTrend = this.getTrend(temperatures);
    const comfortScore = this.getComfortScore(
      averageTemperature,
      averageHumidity,
      windSpeeds.reduce((sum, ws) => sum + ws, 0) / windSpeeds.length,
    );
    const alerts = this.generateAlerts(logs);
    const dayClassification = this.classifyDay(
      averageTemperature,
      averageHumidity,
      rainProbabilities.reduce((sum, rp) => sum + rp, 0) / rainProbabilities.length,
    );

    const insights: Insights = {
      date: startDate, // This might need adjustment if insights are per day, not range start
      averageTemperature,
      maxTemperature,
      minTemperature,
      averageHumidity,
      temperatureTrend,
      comfortScore,
      dayClassification,
      alerts,
    };
    insights.summary = this.generateSummary(insights);

    const existingInsights = await this.insightsRepository.findByDate(startDate);
    if (existingInsights) {
      return this.insightsRepository.update(existingInsights.id, insights);
    } else {
      return this.insightsRepository.create(insights);
    }
  }

  getComfortScore(
    temp: number,
    humidity: number,
    windSpeed: number,
  ): number {
    let score = 100;
    score -= Math.abs(temp - 22) * 2; // -2 points per degree away from 22C
    score -= Math.abs(humidity - 60) * 0.5; // -0.5 points per % away from 60%
    score -= windSpeed * 0.2; // -0.2 points per km/h wind

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  getTrend(temperatures: number[]): TemperatureTrend {
    if (temperatures.length < 2) {
      return TemperatureTrend.STABLE;
    }
    const firstHalfAvg =
      temperatures
        .slice(0, Math.floor(temperatures.length / 2))
        .reduce((sum, temp) => sum + temp, 0) / Math.floor(temperatures.length / 2);
    const secondHalfAvg =
      temperatures
        .slice(Math.ceil(temperatures.length / 2))
        .reduce((sum, temp) => sum + temp, 0) / Math.ceil(temperatures.length / 2);

    if (secondHalfAvg > firstHalfAvg + 1) {
      return TemperatureTrend.RISING;
    } else if (secondHalfAvg < firstHalfAvg - 1) {
      return TemperatureTrend.FALLING;
    }
    return TemperatureTrend.STABLE;
  }

  generateAlerts(logs: WeatherLog[]): Alert[] {
    const alerts: Alert[] = [];
    const maxTemp = Math.max(...logs.map(log => log.temperature));
    const minTemp = Math.min(...logs.map(log => log.temperature));
    const maxWind = Math.max(...logs.map(log => log.windSpeed));
    const maxRainProb = Math.max(...logs.map(log => log.rainProbability || 0));


    if (maxRainProb > 70) {
      alerts.push({ type: 'rain', message: 'Alta probabilidade de chuva.' });
    }
    if (maxTemp > 35) {
      alerts.push({ type: 'heat', message: 'Calor extremo esperado.' });
    }
    if (minTemp < 0) {
      alerts.push({ type: 'cold', message: 'Baixas temperaturas, risco de geada.' });
    }
    if (maxWind > 50) {
      alerts.push({ type: 'wind', message: 'Ventos fortes esperados.' });
    }
    return alerts;
  }

  classifyDay(
    avgTemp: number,
    avgHumidity: number,
    avgRainProb: number,
  ): DayClassification {
    if (avgRainProb > 50) {
      return DayClassification.RAINY;
    }
    if (avgTemp > 30) {
      return DayClassification.HOT;
    }
    if (avgTemp < 10) {
      return DayClassification.COLD;
    }
    return DayClassification.PLEASANT;
  }

  generateSummary(insights: Insights): string {
    let summary = `Para a data ${insights.date.toDateString()}: `;
    summary += `A temperatura média foi de ${insights.averageTemperature.toFixed(1)}°C, variando de ${insights.minTemperature.toFixed(1)}°C a ${insights.maxTemperature.toFixed(1)}°C. `;
    summary += `A umidade média foi de ${insights.averageHumidity.toFixed(1)}%. `;

    switch (insights.temperatureTrend) {
      case TemperatureTrend.RISING:
        summary += 'A tendência de temperatura foi de aumento. ';
        break;
      case TemperatureTrend.FALLING:
        summary += 'A tendência de temperatura foi de queda. ';
        break;
      case TemperatureTrend.STABLE:
        summary += 'A temperatura permaneceu estável. ';
        break;
    }

    if (insights.comfortScore) {
      summary += `O índice de conforto climático foi de ${insights.comfortScore}. `;
    }
    if (insights.dayClassification) {
      summary += `Classificado como um dia ${
        insights.dayClassification === DayClassification.RAINY ? 'chuvoso' :
        insights.dayClassification === DayClassification.HOT ? 'quente' :
        insights.dayClassification === DayClassification.COLD ? 'frio' :
        'agradável'
      }. `;
    }
    if (insights.alerts && insights.alerts.length > 0) {
      summary += `Alertas: ${insights.alerts.map(a => a.message).join(', ')}.`;
    }
    return summary;
  }
}
