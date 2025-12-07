import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { WeatherService } from '../../application/services/weather.service';
import { InsightsService } from '../../application/services/insights.service';

@Controller('api/weather/insights')
export class InsightsController {
  constructor(
    private readonly weatherService: WeatherService,
    private readonly insightsService: InsightsService,
  ) {}

  @Get('today')
  async getTodayInsights(@Query('city') city?: string) {
    // Try to get cached/stored insight first? 
    // For now, let's generate/update on the fly using the service logic
    // which handles stats + AI
    const insight = await this.insightsService.updateRealtimeInsights(city || 'São Paulo');
    
    if (!insight) {
      return {
        message: 'Nenhum dado disponível para hoje',
        stats: null,
        insight: null,
      };
    }

    return {
      stats: {
        averageTemperature: insight.averageTemperature.toFixed(1),
        maxTemperature: insight.maxTemperature,
        minTemperature: insight.minTemperature,
        averageHumidity: insight.averageHumidity.toFixed(1),
        // ... map other fields if needed by frontend
      },
      insight: insight.summary,
      alerts: insight.alerts,
      lastUpdate: insight.generatedAt,
      ...insight // Return full object
    };
  }

  @Post('generate')
  async generateInsightManually(@Body() body: { city: string }) {
    const insight = await this.insightsService.updateRealtimeInsights(body.city);
    return { insight };
  }

  @Get()
  async getInsights(@Query('city') city?: string, @Query('days') days: string = '1') {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const logs = await this.weatherService.findAll({
      startDate,
      city,
      limit: 1000,
    });

    const data = logs.data;

    if (data.length === 0) {
      return { message: 'Nenhum dado disponível', stats: null };
    }

    const temperatures = data.map((log) => log.temperature);
    const humidities = data.map((log) => log.humidity || 0);

    return {
      period: `Últimos ${days} dia(s)`,
      city: city || 'Todas',
      stats: {
        averageTemperature: (
          temperatures.reduce((a, b) => a + b, 0) / temperatures.length
        ).toFixed(1),
        maxTemperature: Math.max(...temperatures),
        minTemperature: Math.min(...temperatures),
        averageHumidity: (
          humidities.reduce((a, b) => a + b, 0) / humidities.length
        ).toFixed(1),
        dataPoints: data.length,
      },
    };
  }
}
