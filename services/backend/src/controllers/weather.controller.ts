import { Controller, Get } from '@nestjs/common';
import { WeatherService } from '../application/services/weather.service';

@Controller('api/weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get('logs')
  async getLogs() {
    return await this.weatherService.getLogs();
  }

  @Get('insights/today')
  async getTodayInsights() {
    return await this.weatherService.getTodayInsights();
  }
}
