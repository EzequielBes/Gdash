import { Injectable, Inject } from '@nestjs/common';
import { WeatherLogRepository } from '../../domain/repositories/weather-log.repository';
import { CreateWeatherLogDto } from '../../presentation/dtos/create-weather-log.dto';
import { WeatherLog } from '../../domain/entities/weather-log.entity';
import * as crypto from 'crypto';

@Injectable()
export class CreateWeatherLogUseCase {
  constructor(
    @Inject(WeatherLogRepository)
    private readonly weatherLogRepository: WeatherLogRepository,
  ) {}

  async execute(data: CreateWeatherLogDto): Promise<WeatherLog> {
    return this.weatherLogRepository.create({
      id: crypto.randomUUID(), 
      ...data,
      timestamp: new Date(data.timestamp),
      createdAt: new Date(),
      city: data.city ?? '', 
      humidity: data.humidity ?? 0, 
    });
  }
}
