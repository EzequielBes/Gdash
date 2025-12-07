import { Injectable, Inject } from '@nestjs/common';
import { WeatherLogRepository, WeatherLogFilters, PaginatedWeatherLogs } from '../../domain/repositories/weather-log.repository';

@Injectable()
export class ListWeatherLogsUseCase {
  constructor(
    @Inject(WeatherLogRepository)
    private readonly weatherLogRepository: WeatherLogRepository,
  ) {}

  async execute(filters: WeatherLogFilters): Promise<PaginatedWeatherLogs> {
    return this.weatherLogRepository.findAll(filters);
  }
}
